// src/lib/db.ts
import {
  collection,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  serverTimestamp,
  writeBatch,
  getDoc,
  updateDoc,
  setDoc,
  orderBy,
  Timestamp,
  getCountFromServer,
  runTransaction,
  increment,
  limit,
} from 'firebase/firestore';
import { db as firestoreDb } from './firebase';
import { songFromDoc, type Song as SongType } from './songs';
import type { User as UserType } from './types/database';
import { v4 as uuidv4 } from 'uuid';

export type Song = SongType;
export type User = UserType;

export const SYNC_LIMIT = 10;

// This represents a setlist stored in the local IndexedDB.
export type Setlist = {
  id: string; // local ID, e.g., "local-12345"
  title: string;
  songIds: string[];
  userId: string;
  createdAt: number; // timestamp
  updatedAt?: number; // timestamp for local updates
  isSynced: boolean;
  firestoreId: string | null; // ID from Firestore after syncing
  isPublic?: boolean; // New field for public setlists
  authorName?: string; // To display who created the setlist
  source?: 'owner' | 'saved'; // 'owner' for user's own, 'saved' for bookmarked
  syncedAt?: number; // Timestamp of the last successful sync
};

export type SetlistWithSyncStatus = Setlist & {
  containsCustomSongs: boolean;
  needsSync: boolean; // Local is newer than cloud
};

export interface PublicUser {
  uid: string;
  displayName: string;
  photoURL?: string;
  publicSetlistsCount: number;
}

// --- Song Functions ---

export function toMillisSafe(ts: unknown): number {
  if (ts && typeof (ts as { toMillis?: Function }).toMillis === 'function') {
    return (ts as { toMillis: () => number }).toMillis();
  }
  if (typeof ts === 'number') {
    return ts;
  }
  if (typeof ts === 'string') {
    const parsed = Date.parse(ts);
    return isNaN(parsed) ? Date.now() : parsed;
  }
  return Date.now();
}

export async function saveSong(song: Song): Promise<void> {
  // Ensure there's a user and Firestore is available for cloud operations
  if (!song.userId || !firestoreDb) {
    throw new Error('User not logged in or Firebase not initialized.');
  }

  // Case 1: Saving a SYSTEM song to a user's library (downloading)
  if (song.source === 'system') {
    await runTransaction(firestoreDb, async (transaction) => {
      const mainSongRef = doc(firestoreDb!, 'songs', song.id);
      const userSongRef = doc(
        firestoreDb!,
        'users',
        song.userId!,
        'userSongs',
        song.id
      );

      // Check if user has already saved this song to avoid double counting
      const userSongSnap = await transaction.get(userSongRef);
      if (userSongSnap.exists()) {
        console.log('User has already saved this song. No count increment.');
        return; // Already saved, do nothing in Firestore.
      }

      // Increment download count and create user's saved record
      transaction.update(mainSongRef, {
        downloadCount: increment(1),
      });
      transaction.set(userSongRef, {
        title: song.title,
        artist: song.artist,
        savedAt: serverTimestamp(),
      });
    });
  }
  // Case 2: Saving/updating a USER-CREATED song
  else if (song.source === 'user') {
    const batch = writeBatch(firestoreDb);

    // Prepare main song document in `songs` collection
    const mainSongRef = doc(firestoreDb, 'songs', song.id);
    const { updatedAt: _, ...songDataForFirestore } = song;
    batch.set(
      mainSongRef,
      { ...songDataForFirestore, updatedAt: serverTimestamp() },
      { merge: true }
    );

    // Prepare user's reference document in `users/{uid}/userSongs` subcollection
    const userSongRef = doc(
      firestoreDb,
      'users',
      song.userId,
      'userSongs',
      song.id
    );
    batch.set(
      userSongRef,
      {
        title: song.title,
        artist: song.artist,
        savedAt: serverTimestamp(), // Use server timestamp for consistency
      },
      { merge: true }
    );

    await batch.commit();
  }
}

export async function deleteSong(id: string, userId: string): Promise<void> {
  const songToDelete = await getCloudSongById(id);

  if (!songToDelete) {
    console.warn(`Song with id ${id} not found in cloud. Nothing to delete.`);
    return;
  }

  if (songToDelete.source === 'system' && userId && firestoreDb) {
    await runTransaction(firestoreDb!, async (transaction) => {
      const mainSongRef = doc(firestoreDb!, 'songs', id);
      const userSongRef = doc(firestoreDb!, 'users', userId, 'userSongs', id);
      const userSongSnap = await transaction.get(userSongRef);

      if (userSongSnap.exists()) {
        const songSnap = await transaction.get(mainSongRef);
        if (songSnap.exists()) {
          const currentCount = songSnap.data().downloadCount || 0;
          if (currentCount > 0) {
            transaction.update(mainSongRef, {
              downloadCount: increment(-1),
            });
          }
        }
        transaction.delete(userSongRef);
      }
    });
  } else if (songToDelete.source === 'user' && userId && firestoreDb) {
    const batch = writeBatch(firestoreDb);
    batch.delete(doc(firestoreDb, 'songs', id));
    batch.delete(doc(firestoreDb, 'users', userId, 'userSongs', id));
    await batch.commit();
  }
}

export async function isSongSaved(
  id: string
): Promise<{ saved: boolean; needsUpdate: boolean }> {
  const { auth } = await import('./firebase');
  const user = auth.currentUser;
  if (!user || user.isAnonymous) return { saved: false, needsUpdate: false };

  const userSongRef = doc(firestoreDb, 'users', user.uid, 'userSongs', id);
  const userSongSnap = await getDoc(userSongRef);

  if (!userSongSnap.exists()) {
    return { saved: false, needsUpdate: false };
  }

  const mainSongRef = doc(firestoreDb, 'songs', id);
  const mainSongSnap = await getDoc(mainSongRef);

  if (!mainSongSnap.exists()) {
    return { saved: true, needsUpdate: false };
  }

  const mainSongData = mainSongSnap.data();
  const userSongData = userSongSnap.data();

  const mainUpdatedAt = (mainSongData.updatedAt as Timestamp)?.toMillis() || 0;
  const userSavedAt = (userSongData.savedAt as Timestamp)?.toMillis() || 0;

  return { saved: true, needsUpdate: mainUpdatedAt > userSavedAt };
}

export async function getAllSavedSongs(userId: string): Promise<Song[]> {
  if (!firestoreDb || !userId) {
    return [];
  }

  const userSongsRef = collection(firestoreDb, 'users', userId, 'userSongs');
  const q = query(userSongsRef);
  const userSongsSnapshot = await getDocs(q);

  const songIds = userSongsSnapshot.docs.map((doc) => doc.id);
  const songPromises = songIds.map((id) => getCloudSongById(id));
  const cloudSongs = (await Promise.all(songPromises)).filter(
    Boolean
  ) as Song[];

  return cloudSongs.sort((a, b) => {
    if (a.source === 'user' && b.source !== 'user') return -1;
    if (a.source !== 'user' && b.source === 'user') return 1;
    return (toMillisSafe(b.updatedAt) || 0) - (toMillisSafe(a.updatedAt) || 0);
  });
}

export async function uploadSongToCloud(song: Song): Promise<void> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');

  const { updatedAt: _, ...songData } = song;

  const dataToUpload = {
    ...songData,
    updatedAt: serverTimestamp(),
    source: 'system',
  };

  try {
    const songDocRef = doc(firestoreDb, 'songs', dataToUpload.id);
    await setDoc(songDocRef, dataToUpload, { merge: true });
  } catch (e: any) {
    console.error('Error uploading song to cloud:', e);
    if (e.code === 'permission-denied') {
      throw new Error('You do not have permission to upload songs.');
    }
    throw new Error('Failed to upload song to the cloud.');
  }
}

export async function getAllCloudSongs(): Promise<Song[]> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');

  const songsCollection = collection(firestoreDb, 'songs');
  const q = query(songsCollection);
  const querySnapshot = await getDocs(q);

  const songs: Song[] = querySnapshot.docs.map(songFromDoc);
  return songs;
}

export async function getCloudSongById(songId: string): Promise<Song | null> {
  if (!firestoreDb) {
    console.warn('Firebase is not configured - cannot fetch cloud song');
    return null;
  }

  try {
    const docRef = doc(firestoreDb, 'songs', songId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return songFromDoc(docSnap);
    } else {
      return null;
    }
  } catch (error: any) {
    console.error('Error getting cloud song:', error);
    return null;
  }
}

export async function deleteCloudSong(songId: string): Promise<void> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');
  try {
    const songDocRef = doc(firestoreDb, 'songs', songId);
    await deleteDoc(songDocRef);
  } catch (e: any) {
    console.error('Error deleting song from cloud:', e);
    if (e.code === 'permission-denied') {
      throw new Error('You do not have permission to delete songs.');
    }
    throw new Error('Failed to delete song from the cloud.');
  }
}

// --- Setlist Functions ---

export async function saveSetlist(setlist: Partial<Setlist>): Promise<string> {
  if (!firestoreDb || !setlist.userId)
    throw new Error('DB not init or user not found');

  const { id, ...dataToSave } = setlist;

  // Use the existing ID if it's an update, otherwise generate a new one
  const docId = id || uuidv4();
  const docRef = doc(firestoreDb, 'setlists', docId);

  // If it's a new setlist, we need to set the firestoreId
  if (!dataToSave.firestoreId) {
    dataToSave.firestoreId = docId;
  }

  await setDoc(
    docRef,
    { ...dataToSave, updatedAt: serverTimestamp() },
    { merge: true }
  );

  return docRef.id;
}

export async function getSetlists(userId: string): Promise<Setlist[]> {
  if (!firestoreDb) return [];

  const q = query(
    collection(firestoreDb, 'setlists'),
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(q);

  const setlists: Setlist[] = [];

  querySnapshot.forEach((doc) => {
    const data = doc.data();
    setlists.push({
      id: doc.id,
      firestoreId: doc.id,
      isSynced: true,
      ...(data as any),
      createdAt: toMillisSafe(data.createdAt),
      updatedAt: toMillisSafe(data.updatedAt),
    });
  });
  console.log('setlists', setlists);
  return setlists;
}

export async function getSetlist(id: string): Promise<Setlist | undefined> {
  if (!firestoreDb) return undefined;
  const docRef = doc(firestoreDb, 'setlists', id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      firestoreId: docSnap.id,
      ...data,
      createdAt: toMillisSafe(data.createdAt),
      updatedAt: toMillisSafe(data.updatedAt),
    } as Setlist;
  }

  return undefined;
}

export async function deleteSetlist(
  id: string,
  _userId: string
): Promise<void> {
  if (!firestoreDb) return;
  const docRef = doc(firestoreDb, 'setlists', id);
  await deleteDoc(docRef);
}

export async function getSyncedSetlistsCount(userId: string): Promise<number> {
  if (!firestoreDb) return 0;
  const q = query(
    collection(firestoreDb, 'setlists'),
    where('userId', '==', userId),
    where('source', '==', 'owner')
  );
  const countSnapshot = await getCountFromServer(q);
  return countSnapshot.data().count;
}

export async function updateSetlistPublicStatus(
  firestoreId: string,
  isPublic: boolean
): Promise<void> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');
  const docRef = doc(firestoreDb, 'setlists', firestoreId);
  await updateDoc(docRef, { isPublic });
}

export async function getPublicSetlists(): Promise<Setlist[]> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');

  const q = query(
    collection(firestoreDb, 'setlists'),
    where('isPublic', '==', true)
  );

  const querySnapshot = await getDocs(q);
  const setlists: Setlist[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const syncedAt = data.syncedAt as Timestamp;
    setlists.push({
      id: doc.id,
      firestoreId: doc.id,
      title: data.title,
      songIds: data.songIds,
      userId: data.userId,
      createdAt: toMillisSafe(data.createdAt),
      isSynced: true,
      isPublic: true,
      authorName: data.authorName || 'Anonymous',
      source: 'saved',
    });
  });

  return setlists;
}

export async function getAllCloudSetlists(): Promise<Setlist[]> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');

  const q = query(
    collection(firestoreDb, 'setlists'),
    orderBy('updatedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const setlists: Setlist[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    setlists.push({
      id: doc.id,
      firestoreId: doc.id,
      title: data.title,
      songIds: data.songIds,
      userId: data.userId,
      createdAt: toMillisSafe(data.createdAt),
      updatedAt: toMillisSafe(data.updatedAt),
      isSynced: true,
      isPublic: data.isPublic || false,
      authorName: data.authorName || 'Anonymous',
      source: 'saved',
    });
  });

  return setlists;
}

// --- User Profile Functions ---

export async function updateUserProfilePublicStatus(
  userId: string,
  isPublic: boolean
): Promise<void> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');
  const userRef = doc(firestoreDb, 'users', userId);
  await updateDoc(userRef, { isProfilePublic: isPublic });
}

export async function getPublicUsers(): Promise<PublicUser[]> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');
  const usersRef = collection(firestoreDb, 'users');
  const q = query(usersRef, where('isProfilePublic', '==', true));

  const usersSnapshot = await getDocs(q);
  const publicUsersPromises = usersSnapshot.docs.map(async (userDoc) => {
    const userData = userDoc.data();
    const setlistsQuery = query(
      collection(firestoreDb, 'setlists'),
      where('userId', '==', userDoc.id),
      where('isPublic', '==', true)
    );
    const publicSetlistsSnapshot = await getCountFromServer(setlistsQuery);
    const publicSetlistsCount = publicSetlistsSnapshot.data().count;

    return {
      uid: userData.uid,
      displayName: userData.displayName,
      photoURL: userData.photoURL,
      publicSetlistsCount,
    };
  });

  const publicUsers = await Promise.all(publicUsersPromises);
  // Filter out users with 0 public setlists
  return publicUsers.filter((user) => user.publicSetlistsCount > 0);
}

export async function getPublicSetlistsByUserId(
  userId: string
): Promise<Setlist[]> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');
  const q = query(
    collection(firestoreDb, 'setlists'),
    where('userId', '==', userId),
    where('isPublic', '==', true),
    orderBy('updatedAt', 'desc')
  );

  const querySnapshot = await getDocs(q);
  const setlists: Setlist[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const syncedAt = data.updatedAt as Timestamp;
    setlists.push({
      id: doc.id,
      firestoreId: doc.id,
      title: data.title,
      songIds: data.songIds,
      userId: data.userId,
      createdAt: toMillisSafe(data.createdAt),
      isSynced: true,
      isPublic: true,
      authorName: data.authorName || 'Anonymous',
      source: 'saved',
    });
  });
  return setlists;
}

export async function getAllUsers(): Promise<User[]> {
  if (!firestoreDb) {
    throw new Error('Firebase not initialized.');
  }

  const usersRef = collection(firestoreDb, 'users');
  const q = query(usersRef);
  const querySnapshot = await getDocs(q);

  const usersPromises = querySnapshot.docs.map(async (userDoc) => {
    const data = userDoc.data();

    const songsRef = collection(firestoreDb!, 'users', userDoc.id, 'userSongs');
    const setlistsRef = collection(
      firestoreDb!,
      'users',
      userDoc.id,
      'userSetlists'
    );

    const songsCountSnapshot = await getCountFromServer(songsRef);
    const setlistsCountSnapshot = await getCountFromServer(setlistsRef);

    return {
      uid: userDoc.id,
      ...data,
      createdAt: toMillisSafe(data.createdAt),
      updatedAt: toMillisSafe(data.lastLoginAt),
      songsCount: songsCountSnapshot.data().count,
      setlistsCount: setlistsCountSnapshot.data().count,
    } as unknown as User;
  });

  return Promise.all(usersPromises);
}

// Function to get a single setlist, ensuring it belongs to the user
export async function getUserSetlist(
  setlistId: string,
  userId: string
): Promise<Setlist | null> {
  if (!firestoreDb) return null;
  const docRef = doc(firestoreDb, 'setlists', setlistId);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists() && docSnap.data().userId === userId) {
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      createdAt: toMillisSafe(data.createdAt),
      updatedAt: toMillisSafe(data.updatedAt),
    } as Setlist;
  }
  return null;
}
export async function getSetlistByFirestoreId(
  firestoreId: string
): Promise<Setlist | null> {
  if (!firestoreDb) {
    return null;
  }

  try {
    const docRef = doc(firestoreDb, 'setlists', firestoreId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const syncedAt = data.updatedAt as Timestamp;
      return {
        id: docSnap.id,
        firestoreId: docSnap.id,
        title: data.title,
        songIds: data.songIds,
        userId: data.userId,
        createdAt: toMillisSafe(data.createdAt),
        updatedAt: toMillisSafe(data.updatedAt),
        isSynced: true,
        isPublic: data.isPublic || false,
        authorName: data.authorName || 'Anonymous',
        source: 'saved',
      };
    } else {
      return null;
    }
  } catch (error: any) {
    return null;
  }
}

// src/lib/db.ts
import {
  collection,
  addDoc,
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
  limit,
  startAfter,
  Timestamp,
  getCountFromServer,
  runTransaction,
  increment,
} from 'firebase/firestore';
import { db as firestoreDb } from './firebase';
import type { Song } from './songs';
import type { User } from './types/database';

const DB_NAME = 'LyricSyncDB';
const DB_VERSION = 2; // Incremented version
const SYNC_LIMIT = 10;

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
  if (!user || !firestoreDb) return { saved: false, needsUpdate: false };

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

  return cloudSongs;
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

const songFromDoc = (doc: any): Song => {
  const data = doc.data();
  const updatedAt = data.updatedAt;
  return {
    id: doc.id,
    title: data.title,
    artist: data.artist,
    lyrics: data.lyrics,
    originalKey: data.originalKey,
    bpm: data.bpm,
    timeSignature: data.timeSignature,
    url: data.url,
    userId: data.userId,
    uploaderName: data.uploaderName,
    uploaderEmail: data.uploaderEmail,
    source: data.source,
    downloadCount: data.downloadCount || 0,
    updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate() : new Date(),
  };
};

export async function getPaginatedSystemSongs(
  page: number,
  pageSize: number
): Promise<{ songs: Song[]; totalPages: number; totalSongs: number }> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');

  const songsCollection = collection(firestoreDb, 'songs');
  const qBase = query(songsCollection, where('source', '==', 'system'));

  const countSnapshot = await getCountFromServer(qBase);
  const totalSongs = countSnapshot.data().count;
  const totalPages = Math.ceil(totalSongs / pageSize);

  if (page > totalPages && totalSongs > 0) {
    return { songs: [], totalPages, totalSongs };
  }

  let q;
  if (page === 1) {
    q = query(qBase, orderBy('title'), limit(pageSize));
  } else {
    // To get the last document of the previous page, we fetch all documents up to the start of the current page.
    const prevPageLastDocQuery = query(
      qBase,
      orderBy('title'),
      limit((page - 1) * pageSize)
    );
    const prevPageSnapshot = await getDocs(prevPageLastDocQuery);
    const lastVisible = prevPageSnapshot.docs[prevPageSnapshot.docs.length - 1];
    q = query(qBase, orderBy('title'), startAfter(lastVisible), limit(pageSize));
  }

  const documentSnapshots = await getDocs(q);
  const songs: Song[] = documentSnapshots.docs.map(songFromDoc);
  return { songs, totalPages, totalSongs };
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

export async function saveSetlist(setlist: Setlist): Promise<void> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');

  const setlistToSave: Setlist = {
    ...setlist,
    updatedAt: Date.now(),
    source: setlist.source || 'owner',
  };

  if (setlistToSave.source === 'owner' && setlistToSave.isSynced && setlistToSave.firestoreId) {
    const setlistDocRef = doc(firestoreDb, 'setlists', setlistToSave.firestoreId);
    const dataForFirestore = {
      title: setlistToSave.title,
      songIds: setlistToSave.songIds,
      syncedAt: serverTimestamp(),
    };
    await updateDoc(setlistDocRef, dataForFirestore);
    const userSetlistRef = doc(firestoreDb, 'users', setlistToSave.userId, 'userSetlists', setlistToSave.firestoreId);
    await updateDoc(userSetlistRef, {
      syncedAt: dataForFirestore.syncedAt,
      title: dataForFirestore.title,
    });
  } else if (setlistToSave.source === 'saved') {
    // Logic for saving a reference to a shared setlist
    const setlistRef = doc(firestoreDb, 'users', setlistToSave.userId, 'savedSetlists', setlistToSave.firestoreId!);
    await setDoc(setlistRef, {
      title: setlistToSave.title,
      originalAuthorName: setlistToSave.authorName,
      savedAt: serverTimestamp(),
    });
  }
}

export async function getSetlists(userId: string): Promise<SetlistWithSyncStatus[]> {
  if (!firestoreDb) return [];

  const userSetlistsRef = collection(firestoreDb, 'users', userId, 'userSetlists');
  const userSetlistsSnapshot = await getDocs(query(userSetlistsRef, orderBy('syncedAt', 'desc')));
  const ownedSetlistIds = userSetlistsSnapshot.docs.map(doc => doc.id);

  const ownedSetlistsPromises = ownedSetlistIds.map(id => getCloudSetlistById(id, 'owner'));

  // TODO: Add fetching for 'saved' setlists from a different subcollection if needed.

  const results = (await Promise.all(ownedSetlistsPromises)).filter(Boolean) as Setlist[];
  
  return results.map(setlist => ({
    ...setlist,
    needsSync: false, // This is now handled by direct Firestore updates, so effectively always false from client's view
    containsCustomSongs: false, // This logic is simplified as all songs are from cloud now
  }));
}

export async function getSetlist(id: string): Promise<Setlist | undefined> {
  // This function now primarily gets from cloud.
  return getCloudSetlistById(id);
}


async function getCloudSetlistById(id: string, source: 'owner' | 'saved' = 'saved'): Promise<Setlist | undefined> {
  if (!firestoreDb) return undefined;
  const docRef = doc(firestoreDb, 'setlists', id);
  const docSnap = await getDoc(docRef);
  if (docSnap.exists()) {
    const data = docSnap.data();
    const syncedAt = data.syncedAt as Timestamp;
    return {
      id: docSnap.id,
      firestoreId: docSnap.id,
      title: data.title,
      songIds: data.songIds,
      userId: data.userId,
      createdAt: syncedAt?.toMillis() || Date.now(),
      updatedAt: syncedAt?.toMillis() || Date.now(),
      isSynced: true,
      isPublic: data.isPublic || false,
      authorName: data.authorName || 'Unknown',
      source: source,
    } as Setlist;
  }
  return undefined;
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
      const syncedAt = data.syncedAt as Timestamp;
      return {
        id: docSnap.id,
        firestoreId: docSnap.id,
        title: data.title,
        songIds: data.songIds,
        userId: data.userId,
        createdAt: syncedAt.toMillis(),
        updatedAt: syncedAt.toMillis(),
        isSynced: true,
        isPublic: data.isPublic || false,
        authorName: data.authorName || 'Unknown',
        source: 'saved',
      };
    } else {
      return null;
    }
  } catch (error: any) {
    return null;
  }
}

export async function deleteSetlist(id: string, userId: string): Promise<void> {
    if (!firestoreDb) throw new Error("Firestore not initialized");

    const batch = writeBatch(firestoreDb);
    // Delete from main setlists collection
    batch.delete(doc(firestoreDb, 'setlists', id));
    // Delete from user's sub-collection
    batch.delete(doc(firestoreDb, 'users', userId, 'userSetlists', id));
    await batch.commit();
}


export async function getSyncedSetlistsCount(userId: string): Promise<number> {
  if (!firestoreDb) return 0;
  const q = query(collection(firestoreDb, 'users', userId, 'userSetlists'));
  const countSnapshot = await getCountFromServer(q);
  return countSnapshot.data().count;
}

export async function syncSetlist(
  setlist: Omit<Setlist, 'id'>,
  userId: string,
  authorName?: string
): Promise<string> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');

  const count = await getSyncedSetlistsCount(userId);
  if (count >= SYNC_LIMIT) {
    throw new Error('SYNC_LIMIT_REACHED');
  }

  const now = serverTimestamp();
  const dataToSync: any = {
    ...setlist,
    userId,
    syncedAt: now,
    authorName: authorName || 'Anonymous',
    isPublic: false,
  };

  const newDocRef = await addDoc(collection(firestoreDb, 'setlists'), dataToSync);
  const firestoreId = newDocRef.id;

  await setDoc(
    doc(firestoreDb, 'users', userId, 'userSetlists', firestoreId),
    {
      title: setlist.title,
      syncedAt: now,
    }
  );
  
  return firestoreId;
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
      createdAt: syncedAt?.toMillis() || Date.now(),
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
    orderBy('syncedAt', 'desc')
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
      createdAt: syncedAt?.toMillis() || Date.now(),
      updatedAt: syncedAt?.toMillis() || Date.now(),
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
  const publicUsers: PublicUser[] = [];

  for (const userDoc of usersSnapshot.docs) {
    const userData = userDoc.data();
    const setlistsRef = collection(
      firestoreDb,
      `users/${userDoc.id}/userSetlists`
    );
    const setlistsSnapshot = await getDocs(query(setlistsRef));
    const publicSetlistsCount = setlistsSnapshot.size;

    if (publicSetlistsCount > 0) {
      publicUsers.push({
        uid: userData.uid,
        displayName: userData.displayName,
        photoURL: userData.photoURL,
        publicSetlistsCount,
      });
    }
  }

  return publicUsers;
}

export async function getPublicSetlistsByUserId(
  userId: string
): Promise<Setlist[]> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');
  const q = query(
    collection(firestoreDb, 'setlists'),
    where('userId', '==', userId),
    where('isPublic', '==', true),
    orderBy('syncedAt', 'desc')
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
      createdAt: syncedAt?.toMillis() || Date.now(),
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
    const setlistsRef = collection(firestoreDb!, 'users', userDoc.id, 'userSetlists');

    const songsCountSnapshot = await getCountFromServer(songsRef);
    const setlistsCountSnapshot = await getCountFromServer(setlistsRef);

    return {
      uid: userDoc.id,
      ...data,
      createdAt: (data.createdAt as Timestamp)?.toDate() || new Date(),
      updatedAt: (data.lastLoginAt as Timestamp)?.toDate() || new Date(),
      songsCount: songsCountSnapshot.data().count,
      setlistsCount: setlistsCountSnapshot.data().count,
    } as User;
  });

  return Promise.all(usersPromises);
}


// src/lib/db.ts
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Song } from './songs';
import { db as firestoreDb } from './firebase';
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
  type DocumentSnapshot,
  type DocumentData,
} from 'firebase/firestore';

const DB_NAME = 'LyricSyncDB';
const DB_VERSION = 2; // Incremented version
const SONGS_STORE = 'songs';
const SETLISTS_STORE = 'setlists';
const SYNC_LIMIT = 5;

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
  sourceFirestoreId?: string | null; // ID of the original cloud setlist if this was copied
};

export type SetlistWithSyncStatus = Setlist & {
  containsCustomSongs: boolean;
  needsSync: boolean; // Local is newer than cloud
};

interface LyricSyncDB extends DBSchema {
  [SONGS_STORE]: {
    key: string;
    value: Song;
  };
  [SETLISTS_STORE]: {
    key: string;
    value: Setlist;
    indexes: { 'by-userId': string };
  };
}

let dbPromise: Promise<IDBPDatabase<LyricSyncDB>> | null = null;

function getDb(): Promise<IDBPDatabase<LyricSyncDB>> {
  if (!dbPromise) {
    dbPromise = openDB<LyricSyncDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (oldVersion < 1) {
          if (!db.objectStoreNames.contains(SONGS_STORE)) {
            db.createObjectStore(SONGS_STORE, { keyPath: 'id' });
          }
          if (!db.objectStoreNames.contains(SETLISTS_STORE)) {
            const setlistStore = db.createObjectStore(SETLISTS_STORE, {
              keyPath: 'id',
            });
            setlistStore.createIndex('by-title', 'title');
          }
        }
        if (oldVersion < 2) {
          // Must use the existing transaction in an upgrade function.
          const setlistStore = transaction.objectStore(SETLISTS_STORE);
          if (setlistStore.indexNames.contains('by-title')) {
            setlistStore.deleteIndex('by-title');
          }
          if (!setlistStore.indexNames.contains('by-userId')) {
            setlistStore.createIndex('by-userId', 'userId');
          }
        }
      },
    });
  }
  return dbPromise;
}

// --- Song Functions ---

export async function saveSong(song: Song): Promise<void> {
  const db = await getDb();
  const songToSave = { ...song, updatedAt: new Date() };
  await db.put(SONGS_STORE, songToSave);
}

export async function updateSong(song: Song): Promise<void> {
  const db = await getDb();
  const latestSong = await getCloudSongById(song.id);
  if (!latestSong) {
    throw new Error('Could not find the latest version of this song.');
  }
  await db.put(SONGS_STORE, { ...latestSong, updatedAt: new Date() });
}

export async function getSong(id: string): Promise<Song | undefined> {
  const db = await getDb();
  return db.get(SONGS_STORE, id);
}

export async function deleteSong(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(SONGS_STORE, id);
}

export async function isSongSaved(
  id: string
): Promise<{ saved: boolean; needsUpdate: boolean }> {
  const db = await getDb();
  const savedSong = await db.get(SONGS_STORE, id);

  if (!savedSong) {
    return { saved: false, needsUpdate: false };
  }

  // Custom songs created by the user don't need updates from the cloud.
  if (savedSong.source === 'user') {
    return { saved: true, needsUpdate: false };
  }

  // For system songs, check against the cloud version.
  const latestSong = await getCloudSongById(id);

  // If the song doesn't exist in the cloud anymore, it can't be updated.
  if (!latestSong) {
    return { saved: true, needsUpdate: false };
  }

  const cloudVersionDate = new Date(latestSong.updatedAt).getTime();
  const localVersionDate = savedSong.updatedAt
    ? new Date(savedSong.updatedAt).getTime()
    : 0;

  return { saved: true, needsUpdate: cloudVersionDate > localVersionDate };
}

export async function getAllSavedSongs(): Promise<Song[]> {
  const db = await getDb();
  return db.getAll(SONGS_STORE);
}

export async function getAllSavedSongIds(): Promise<string[]> {
  const db = await getDb();
  return db.getAllKeys(SONGS_STORE);
}

// --- Super Admin Song Upload ---
export async function uploadSongToCloud(song: Song): Promise<void> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');

  const { updatedAt, ...songData } = song;

  const dataToUpload = {
    ...songData,
    updatedAt: serverTimestamp(), // Use Firestore server timestamp for consistency
  };

  try {
    const songDocRef = doc(firestoreDb, 'songs', dataToUpload.id);
    await setDoc(songDocRef, dataToUpload, { merge: true }); // Use setDoc with merge to create or update
  } catch (e: any) {
    console.error('Error uploading song to cloud:', e);
    if (e.code === 'permission-denied') {
      throw new Error('You do not have permission to upload songs.');
    }
    throw new Error('Failed to upload song to the cloud.');
  }
}

export async function getPaginatedCloudSongs(
  pageSize: number,
  startAfterDoc?: DocumentSnapshot<DocumentData>
): Promise<{
  songs: Song[];
  lastVisible: DocumentSnapshot<DocumentData> | null;
}> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');

  const songsCollection = collection(firestoreDb, 'songs');
  let q;

  if (startAfterDoc) {
    q = query(
      songsCollection,
      orderBy('title'),
      startAfter(startAfterDoc),
      limit(pageSize)
    );
  } else {
    q = query(songsCollection, orderBy('title'), limit(pageSize));
  }

  const documentSnapshots = await getDocs(q);

  const songs: Song[] = [];
  documentSnapshots.forEach((doc) => {
    const data = doc.data();
    const updatedAt = data.updatedAt;
    songs.push({
      id: doc.id,
      title: data.title,
      artist: data.artist,
      lyrics: data.lyrics,
      originalKey: data.originalKey,
      bpm: data.bpm,
      timeSignature: data.timeSignature,
      userId: data.userId,
      uploaderName: data.uploaderName,
      uploaderEmail: data.uploaderEmail,
      source: data.source,
      updatedAt:
        updatedAt instanceof Timestamp ? updatedAt.toDate() : new Date(),
    } as Song);
  });

  const lastVisible = documentSnapshots.docs[documentSnapshots.docs.length - 1];

  return { songs, lastVisible: lastVisible || null };
}

export async function getAllCloudSongs(): Promise<Song[]> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');

  const songsCollection = collection(firestoreDb, 'songs');
  const q = query(songsCollection, orderBy('title'));
  const querySnapshot = await getDocs(q);

  const songs: Song[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const updatedAt = data.updatedAt;
    songs.push({
      id: doc.id,
      title: data.title,
      artist: data.artist,
      lyrics: data.lyrics,
      originalKey: data.originalKey,
      bpm: data.bpm,
      timeSignature: data.timeSignature,
      userId: data.userId,
      uploaderName: data.uploaderName,
      uploaderEmail: data.uploaderEmail,
      source: data.source,
      updatedAt:
        updatedAt instanceof Timestamp ? updatedAt.toDate() : new Date(),
    } as Song);
  });

  return songs;
}

export async function getCloudSongById(songId: string): Promise<Song | null> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');

  try {
    const docRef = doc(firestoreDb, 'songs', songId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const updatedAt = data.updatedAt;
      return {
        id: docSnap.id,
        ...data,
        updatedAt:
          updatedAt instanceof Timestamp ? updatedAt.toDate() : new Date(),
      } as Song;
    } else {
      console.log('No such document!');
      return null;
    }
  } catch (error) {
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
  const db = await getDb();
  const setlistToSave: Setlist = {
    ...setlist,
    updatedAt: Date.now(), // Ensure updatedAt is always set on save/update
  };
  await db.put(SETLISTS_STORE, setlistToSave);
}

export async function getSetlists(
  userId: string
): Promise<SetlistWithSyncStatus[]> {
  const db = await getDb(); // This `db` is for IndexedDB

  // If firestore isn't configured, just return local results.
  if (!firestoreDb) {
    const localSetlists = await db.getAllFromIndex(
      SETLISTS_STORE,
      'by-userId',
      userId
    );
    return localSetlists.map((sl) => ({
      ...sl,
      containsCustomSongs: sl.songIds.some((id) => id.startsWith('custom-')),
      needsSync: false,
    }));
  }

  // 1. Fetch user's setlist references from sub-collection
  const userSetlistsRef = collection(firestoreDb, 'users', userId, 'userSetlists');
  const userSetlistsSnapshot = await getDocs(query(userSetlistsRef, orderBy('syncedAt', 'desc')));
  const syncedSetlistIds = userSetlistsSnapshot.docs.map(doc => doc.id);

  // 2. Fetch full setlist data for the referenced setlists
  const syncedSetlistsData: Setlist[] = [];
  if (syncedSetlistIds.length > 0) {
    const setlistPromises = syncedSetlistIds.map(id => getDoc(doc(firestoreDb, 'setlists', id)));
    const setlistDocs = await Promise.all(setlistPromises);
    
    setlistDocs.forEach(docSnap => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            const syncedAt = data.syncedAt as Timestamp;
            syncedSetlistsData.push({
                id: `local-${docSnap.id}`, // Create a predictable local ID
                firestoreId: docSnap.id,
                title: data.title,
                songIds: data.songIds,
                userId: data.userId,
                createdAt: syncedAt?.toMillis() || Date.now(),
                updatedAt: syncedAt?.toMillis() || Date.now(),
                isSynced: true,
                isPublic: data.isPublic || false,
                authorName: data.authorName || '',
            });
        }
    });
  }
  
  // 3. Update local DB with the latest from the cloud
  const localDb = await getDb();
  const tx = localDb.transaction(SETLISTS_STORE, 'readwrite');
  const store = tx.objectStore(SETLISTS_STORE);
  // Clear old synced setlists for this user before adding new ones to prevent duplicates
  const allUserSetlists = await store.index('by-userId').getAll(userId);
  for (const sl of allUserSetlists) {
    if (sl.isSynced) {
      await store.delete(sl.id);
    }
  }
  // Add the fresh data from firestore
  for (const sl of syncedSetlistsData) {
    await store.put(sl);
  }
  await tx.done;

  // 4. Get all setlists (synced + local-only) for the user from local DB
  const finalUserSetlists = await localDb.getAllFromIndex(SETLISTS_STORE, 'by-userId', userId);

  // 5. Calculate sync status
  const results = finalUserSetlists.map(local => {
    const containsCustomSongs = local.songIds.some(id => id.startsWith('custom-'));
    let needsSync = false;
    if (local.isSynced && local.firestoreId) {
       const firestoreDoc = syncedSetlistsData.find(d => d.firestoreId === local.firestoreId);
       if (firestoreDoc) {
           needsSync = (local.updatedAt || 0) > (firestoreDoc.updatedAt || 0);
       }
    }

    return {
        ...local,
        containsCustomSongs,
        needsSync,
    }
  });

  return results;
}

export async function getSetlist(id: string): Promise<Setlist | undefined> {
  const db = await getDb();
  return db.get(SETLISTS_STORE, id);
}

export async function getSetlistByFirestoreId(
  firestoreId: string
): Promise<Setlist | null> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');

  try {
    const docRef = doc(firestoreDb, 'setlists', firestoreId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const syncedAt = data.syncedAt as Timestamp;
      return {
        id: `shared-${docSnap.id}`, // Temporary ID for display
        firestoreId: docSnap.id,
        title: data.title,
        songIds: data.songIds,
        userId: data.userId,
        createdAt: syncedAt.toMillis(),
        updatedAt: syncedAt.toMillis(),
        isSynced: true,
        isPublic: data.isPublic || false,
        authorName: data.authorName || 'Unknown',
      };
    } else {
      return null;
    }
  } catch (error) {
    console.error('Error getting shared setlist:', error);
    return null;
  }
}

export async function deleteSetlist(id: string, userId: string): Promise<void> {
  const db = await getDb();
  const setlistToDelete = await db.get(SETLISTS_STORE, id);

  if (!setlistToDelete) throw new Error("Setlist not found in local DB.");
  if (setlistToDelete.userId !== userId) throw new Error('Unauthorized to delete this setlist.');

  // If it's synced, delete from Firestore first
  if (firestoreDb && setlistToDelete.isSynced && setlistToDelete.firestoreId) {
      const batch = writeBatch(firestoreDb);
      // Delete from main setlists collection
      batch.delete(doc(firestoreDb, 'setlists', setlistToDelete.firestoreId));
      // Delete from user's sub-collection
      batch.delete(doc(firestoreDb, 'users', userId, 'userSetlists', setlistToDelete.firestoreId));
      await batch.commit();
  }

  await db.delete(SETLISTS_STORE, id);
}

export async function getSyncedSetlistsCount(userId: string): Promise<number> {
  if (!firestoreDb) return 0;
  const q = query(collection(firestoreDb, 'users', userId, 'userSetlists'));
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
}

export async function syncSetlist(
  setlistId: string,
  userId: string,
  authorName?: string
): Promise<void> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');

  const db = await getDb();
  const setlist = await db.get(SETLISTS_STORE, setlistId);

  if (!setlist) throw new Error('Setlist not found locally.');
  if (setlist.userId !== userId) throw new Error('Unauthorized');

  if (setlist.songIds.some((id) => id.startsWith('custom-'))) {
    throw new Error('Cannot sync setlists with custom songs.');
  }

  const now = serverTimestamp();
  const dataToSync: any = {
    title: setlist.title,
    songIds: setlist.songIds,
    userId: setlist.userId,
    syncedAt: now,
    authorName: authorName || 'Anonymous',
  };

  let firestoreId = setlist.firestoreId;

  if (setlist.isSynced && firestoreId) {
    // This is an update to an existing synced setlist
    await updateDoc(doc(firestoreDb, 'setlists', firestoreId), dataToSync);
    // Also update the reference doc timestamp
    await updateDoc(doc(firestoreDb, 'users', userId, 'userSetlists', firestoreId), { syncedAt: now });
  } else {
    // This is a new setlist being synced for the first time
    const count = await getSyncedSetlistsCount(userId);
    if (count >= SYNC_LIMIT) {
      throw new Error('SYNC_LIMIT_REACHED');
    }
    // New setlists are not public by default
    dataToSync.isPublic = false;
    const newDocRef = await addDoc(collection(firestoreDb, 'setlists'), dataToSync);
    firestoreId = newDocRef.id;
    // Create reference in user's sub-collection
    await setDoc(doc(firestoreDb, 'users', userId, 'userSetlists', firestoreId), {
        title: setlist.title,
        syncedAt: now,
    });
  }

  setlist.firestoreId = firestoreId;
  setlist.isSynced = true;
  setlist.updatedAt = Date.now(); // Mark local as up-to-date
  await db.put(SETLISTS_STORE, setlist);
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
    where('isPublic', '==', true),
    orderBy('title')
  );

  const querySnapshot = await getDocs(q);
  const setlists: Setlist[] = [];
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    const syncedAt = data.syncedAt as Timestamp;
    setlists.push({
      id: `shared-${doc.id}`, // Use a unique prefix for display
      firestoreId: doc.id,
      title: data.title,
      songIds: data.songIds,
      userId: data.userId,
      createdAt: syncedAt?.toMillis() || Date.now(),
      isSynced: true,
      isPublic: true,
      authorName: data.authorName || 'Anonymous',
    });
  });

  return setlists;
}

export async function unsyncSetlist(
  localId: string,
  userId: string,
  firestoreId: string
): Promise<void> {
  if (!firestoreDb) throw new Error('Firebase is not configured.');
  const db = await getDb();
  const setlist = await db.get(SETLISTS_STORE, localId);

  if (!setlist) throw new Error('Setlist not found locally.');
  if (setlist.userId !== userId) throw new Error('Unauthorized');
  if (!setlist.isSynced || setlist.firestoreId !== firestoreId) {
    throw new Error('Sync mismatch.');
  }

  // Delete from both places in a batch
  const batch = writeBatch(firestoreDb);
  batch.delete(doc(firestoreDb, 'setlists', firestoreId));
  batch.delete(doc(firestoreDb, 'users', userId, 'userSetlists', firestoreId));
  await batch.commit();

  setlist.isSynced = false;
  setlist.firestoreId = null;
  await db.put(SETLISTS_STORE, setlist);
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
      id: `cloud-${doc.id}`, // Use a unique prefix for display
      firestoreId: doc.id,
      title: data.title,
      songIds: data.songIds,
      userId: data.userId,
      createdAt: syncedAt?.toMillis() || Date.now(),
      updatedAt: syncedAt?.toMillis() || Date.now(),
      isSynced: true,
      isPublic: data.isPublic || false,
      authorName: data.authorName || 'Anonymous',
    });
  });

  return setlists;
}

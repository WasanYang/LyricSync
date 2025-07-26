
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
  source?: 'owner' | 'saved'; // 'owner' for user's own, 'saved' for bookmarked
  syncedAt?: number; // Timestamp of the last successful sync
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

  // Save to local IndexedDB
  await db.put(SONGS_STORE, songToSave);

  // If it's a user-created song, also save/update it in Firestore
  if (song.source === 'user' && song.userId && firestoreDb) {
    try {
      const batch = writeBatch(firestoreDb);

      // 1. Create/Update the main song document in the 'songs' collection
      const mainSongRef = doc(firestoreDb, 'songs', song.id);
      const { updatedAt, ...songDataForFirestore } = songToSave; // Exclude local date
      batch.set(
        mainSongRef,
        {
          ...songDataForFirestore,
          updatedAt: serverTimestamp(), // Use server timestamp
        },
        { merge: true }
      );

      // 2. Create/Update the reference document in the user's 'userSongs' sub-collection
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
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      await batch.commit();
    } catch (error) {
      console.error('Error syncing user song to Firestore:', error);
      // Decide if we should re-throw or just log the error
      // For now, we'll let the local save succeed and just log the cloud error
    }
  }
}

export async function updateSong(song: Song): Promise<void> {
  const db = await getDb();
  const latestSong = await getCloudSongById(song.id);
  if (!latestSong) {
    throw new Error('Could not find the latest version of this song.');
  }
  // This function is for updating a locally-cached SYSTEM song.
  // The main saveSong handles user-created songs.
  await db.put(SONGS_STORE, { ...latestSong, updatedAt: new Date() });
}

export async function getSong(id: string): Promise<Song | undefined> {
  const db = await getDb();
  return db.get(SONGS_STORE, id);
}

export async function deleteSong(id: string): Promise<void> {
  const db = await getDb();
  const songToDelete = await db.get(SONGS_STORE, id);

  if (!songToDelete) {
    // If not found locally, just return. Maybe it was already deleted.
    return;
  }

  // If it was a user-synced song, delete from Firestore as well
  if (songToDelete.source === 'user' && songToDelete.userId && firestoreDb) {
    try {
      const batch = writeBatch(firestoreDb);
      // Delete from main 'songs' collection
      const mainSongRef = doc(firestoreDb, 'songs', id);
      batch.delete(mainSongRef);
      // Delete from user's sub-collection
      const userSongRef = doc(
        firestoreDb,
        'users',
        songToDelete.userId,
        'userSongs',
        id
      );
      batch.delete(userSongRef);
      await batch.commit();
    } catch (error) {
      console.error('Error deleting user song from Firestore:', error);
      // Optional: handle error, e.g., re-add to local DB or notify user
    }
  }

  // Delete from local IndexedDB
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

  // For user-created songs, they are "saved" by definition if they exist locally.
  // We rely on the sync process in getAllSavedSongs to keep them updated.
  if (savedSong.source === 'user') {
    return { saved: true, needsUpdate: false };
  }

  // For system songs, check against the cloud version for updates.
  const latestSong = await getCloudSongById(id);

  if (!latestSong) {
    // The system song was removed from the cloud.
    return { saved: true, needsUpdate: false };
  }

  const cloudVersionDate = new Date(latestSong.updatedAt).getTime();
  const localVersionDate = savedSong.updatedAt
    ? new Date(savedSong.updatedAt).getTime()
    : 0;

  return { saved: true, needsUpdate: cloudVersionDate > localVersionDate };
}

export async function getAllSavedSongs(userId: string): Promise<Song[]> {
  const db = await getDb();

  // Sync user songs from Firestore to IndexedDB first
  if (firestoreDb && userId) {
    const userSongsRef = collection(firestoreDb, 'users', userId, 'userSongs');
    const q = query(userSongsRef);
    const userSongsSnapshot = await getDocs(q);

    const songIds = userSongsSnapshot.docs.map((doc) => doc.id);
    const songPromises = songIds.map((id) => getCloudSongById(id));
    const cloudSongs = (await Promise.all(songPromises)).filter(
      Boolean
    ) as Song[];

    // Update local IndexedDB with the latest from the cloud
    const tx = db.transaction(SONGS_STORE, 'readwrite');
    const store = tx.objectStore(SONGS_STORE);

    // Efficiently update local store with latest cloud versions of user songs
    const writePromises = cloudSongs.map((song) => store.put(song));

    await Promise.all(writePromises);
    await tx.done;
  }

  // Return all songs from IndexedDB. This will include system songs
  // that were downloaded manually and all of the user's own songs synced from the cloud.
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
    source: 'system', // Ensure source is 'system' when using this function
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
  const queryConstraints = [orderBy('title'), limit(pageSize)];

  if (startAfterDoc) {
    queryConstraints.push(startAfter(startAfterDoc));
  }

  const q = query(songsCollection, ...queryConstraints);

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
  if (!firestoreDb) {
    console.warn('Firebase is not configured - cannot fetch cloud song');
    return null;
  }

  // Check if we're offline
  if (!navigator.onLine) {
    console.log('Offline: Cannot fetch cloud song');
    return null;
  }

  try {
    const docRef = doc(firestoreDb, 'songs', songId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const updatedAt = data.updatedAt;
      const song = {
        id: docSnap.id,
        ...data,
        updatedAt:
          updatedAt instanceof Timestamp ? updatedAt.toDate() : new Date(),
      } as Song;

      console.log(`☁️ Successfully fetched song "${song.title}" from cloud`);
      return song;
    } else {
      console.log(`❌ Cloud song ${songId} not found`);
      return null;
    }
  } catch (error: any) {
    console.error('❌ Error getting cloud song:', error);

    // Handle specific Firebase errors
    if (error.code === 'unavailable') {
      console.warn('Firebase is temporarily unavailable - working offline');
    } else if (error.code === 'permission-denied') {
      console.warn('Permission denied for song access');
    }

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
  // Always update the local updatedAt timestamp on any save operation.
  const setlistToSave: Setlist = {
    ...setlist,
    updatedAt: Date.now(),
    source: setlist.source || 'owner',
  };

  // 1. Save to local IndexedDB first to ensure data is never lost.
  await db.put(SETLISTS_STORE, setlistToSave);

  // 2. If the setlist is an "owned" and synced setlist, also update Firestore.
  if (
    firestoreDb &&
    setlistToSave.source === 'owner' &&
    setlistToSave.isSynced &&
    setlistToSave.firestoreId
  ) {
    try {
      const setlistDocRef = doc(
        firestoreDb,
        'setlists',
        setlistToSave.firestoreId
      );
      const dataForFirestore = {
        title: setlistToSave.title,
        songIds: setlistToSave.songIds,
        syncedAt: serverTimestamp(), // Use server timestamp to mark the update time
      };
      await updateDoc(setlistDocRef, dataForFirestore);

      // Also update the user's reference doc to keep the synced time consistent
      const userSetlistRef = doc(
        firestoreDb,
        'users',
        setlistToSave.userId,
        'userSetlists',
        setlistToSave.firestoreId
      );
      await updateDoc(userSetlistRef, {
        syncedAt: dataForFirestore.syncedAt,
        title: dataForFirestore.title, // Also update title here
      });

      // Update local record with new syncedAt time from the server for consistency
      const updatedSetlist = await getDoc(setlistDocRef);
      if (updatedSetlist.exists()) {
        const cloudData = updatedSetlist.data();
        setlistToSave.syncedAt = (
          cloudData.syncedAt as Timestamp
        ).toMillis();
        await db.put(SETLISTS_STORE, setlistToSave);
      }
    } catch (error) {
      console.error('Error updating synced setlist in Firestore:', error);
      // Optional: Handle this error, e.g., by marking the setlist as needing sync again.
    }
  }
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
      containsCustomSongs: false, // Cannot determine without song sources
      needsSync: false,
    }));
  }

  // 1. Fetch user's OWNED & SYNCED setlist references from sub-collection
  const userSetlistsRef = collection(
    firestoreDb,
    'users',
    userId,
    'userSetlists'
  );
  const userSetlistsSnapshot = await getDocs(
    query(userSetlistsRef, orderBy('syncedAt', 'desc'))
  );
  const syncedSetlistIds = userSetlistsSnapshot.docs.map((doc) => doc.id);

  // 2. Fetch full setlist data for the referenced setlists
  const syncedSetlistsData: Setlist[] = [];
  if (syncedSetlistIds.length > 0) {
    const setlistPromises = syncedSetlistIds.map((id) =>
      getDoc(doc(firestoreDb, 'setlists', id))
    );
    const setlistDocs = await Promise.all(setlistPromises);

    setlistDocs.forEach((docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const syncedAt = data.syncedAt as Timestamp;
        syncedSetlistsData.push({
          id: data.id || docSnap.id,
          firestoreId: docSnap.id,
          title: data.title,
          songIds: data.songIds,
          userId: data.userId,
          createdAt: syncedAt?.toMillis() || Date.now(),
          updatedAt: syncedAt?.toMillis() || Date.now(),
          syncedAt: syncedAt?.toMillis() || Date.now(),
          isSynced: true,
          isPublic: data.isPublic || false,
          authorName: data.authorName || '',
          source: 'owner',
        });
      }
    });
  }

  // 3. Update local DB with the latest synced versions of owned setlists
  const localDb = await getDb();
  const tx = localDb.transaction(SETLISTS_STORE, 'readwrite');
  const store = tx.objectStore(SETLISTS_STORE);

  const allUserSetlists = await store.index('by-userId').getAll(userId);
  for (const sl of allUserSetlists) {
    // Remove old synced versions to replace them with fresh data from cloud
    if (sl.isSynced && sl.source === 'owner') {
      await store.delete(sl.id);
    }
  }
  // Add the fresh data from firestore
  for (const sl of syncedSetlistsData) {
    // Check if a local version already exists to preserve its local ID
    const existingLocal = allUserSetlists.find(
      (l) => l.firestoreId === sl.firestoreId
    );
    await store.put({
      ...sl,
      id: existingLocal?.id || sl.firestoreId || sl.id,
    });
  }
  await tx.done;

  // 4. Get all setlists (owned, local-only, and saved) for the user from local DB
  const finalUserSetlists = await localDb.getAllFromIndex(
    SETLISTS_STORE,
    'by-userId',
    userId
  );

  // 5. Fetch all songs to check source for custom song validation
  const allLocalSongs = await db.getAll(SONGS_STORE);
  const songSourceMap = new Map(allLocalSongs.map((s) => [s.id, s.source]));

  // 6. Calculate sync status for owned setlists
  const results = finalUserSetlists.map((local) => {
    if (local.source === 'saved') {
      return { ...local, containsCustomSongs: false, needsSync: false };
    }

    const containsCustomSongs = local.songIds.some(
      (id) => songSourceMap.get(id) === 'user'
    );
    let needsSync = false;
    if (local.isSynced) {
      // A setlist needs sync if its local update time is more recent than its last cloud sync time.
      needsSync = (local.updatedAt || 0) > (local.syncedAt || 0);
    }

    return {
      ...local,
      containsCustomSongs,
      needsSync,
    };
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
  if (!firestoreDb) {
    console.warn('Firebase is not configured - cannot fetch cloud setlist');
    return null;
  }

  // Check if we're offline
  if (!navigator.onLine) {
    console.log('Offline: Cannot fetch cloud setlist');
    return null;
  }

  try {
    const docRef = doc(firestoreDb, 'setlists', firestoreId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const syncedAt = data.syncedAt as Timestamp;
      const setlist = {
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
        source: 'saved' as const, // A setlist retrieved by Firestore ID is always from another source
      };

      console.log(
        `☁️ Successfully fetched setlist "${setlist.title}" from cloud`
      );
      return setlist;
    } else {
      console.log(`❌ Cloud setlist ${firestoreId} not found`);
      return null;
    }
  } catch (error: any) {
    console.error('❌ Error getting shared setlist:', error);

    // Handle specific Firebase errors
    if (error.code === 'unavailable') {
      console.warn('Firebase is temporarily unavailable - working offline');
    } else if (error.code === 'permission-denied') {
      console.warn('Permission denied for setlist access');
    }

    return null;
  }
}

export async function deleteSetlist(id: string, userId: string): Promise<void> {
  const db = await getDb();
  const setlistToDelete = await db.get(SETLISTS_STORE, id);

  if (!setlistToDelete) throw new Error('Setlist not found in local DB.');
  if (setlistToDelete.userId !== userId)
    throw new Error('Unauthorized to delete this setlist.');

  // If it's a synced, owned setlist, delete from Firestore first
  if (
    firestoreDb &&
    setlistToDelete.isSynced &&
    setlistToDelete.firestoreId &&
    setlistToDelete.source === 'owner'
  ) {
    const batch = writeBatch(firestoreDb);
    // Delete from main setlists collection
    batch.delete(doc(firestoreDb, 'setlists', setlistToDelete.firestoreId));
    // Delete from user's sub-collection
    batch.delete(
      doc(
        firestoreDb,
        'users',
        userId,
        'userSetlists',
        setlistToDelete.firestoreId
      )
    );
    await batch.commit();
  }

  // Always delete from local DB (for both owned and saved setlists)
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

  // Check if any song in the setlist is a 'user' song.
  const allSongs = await db.getAll(SONGS_STORE);
  const songSourceMap = new Map(allSongs.map((s) => [s.id, s.source]));
  const containsUserSongs = setlist.songIds.some(
    (id) => songSourceMap.get(id) === 'user'
  );

  if (containsUserSongs) {
    throw new Error(
      'Cannot sync setlists with custom songs. All songs must be system songs.'
    );
  }

  const now = serverTimestamp();
  const dataToSync: any = {
    id: setlist.id,
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
    await updateDoc(
      doc(firestoreDb, 'users', userId, 'userSetlists', firestoreId),
      { syncedAt: now }
    );
  } else {
    // This is a new setlist being synced for the first time
    const count = await getSyncedSetlistsCount(userId);
    if (count >= SYNC_LIMIT) {
      throw new Error('SYNC_LIMIT_REACHED');
    }
    // New setlists are not public by default
    dataToSync.isPublic = false;
    const newDocRef = await addDoc(
      collection(firestoreDb, 'setlists'),
      dataToSync
    );
    firestoreId = newDocRef.id;
    // Create reference in user's sub-collection
    await setDoc(
      doc(firestoreDb, 'users', userId, 'userSetlists', firestoreId),
      {
        title: setlist.title,
        syncedAt: now,
      }
    );
  }

  setlist.firestoreId = firestoreId;
  setlist.isSynced = true;
  setlist.syncedAt = Date.now(); // Mark local sync time to current client time
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

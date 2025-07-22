// src/lib/db.ts
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Song } from './songs';
import { db as firestoreDb } from './firebase'; 
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, serverTimestamp, writeBatch, getDoc, updateDoc, setDoc, orderBy, Timestamp } from 'firebase/firestore';


const DB_NAME = 'RhythmicReadsDB';
const DB_VERSION = 2; // Incremented version
const SONGS_STORE = 'songs';
const SETLISTS_STORE = 'setlists';
const SYNC_LIMIT = 5;

export type Setlist = {
  id: string; // local ID, e.g., "local-12345"
  title: string;
  songIds: string[];
  userId: string;
  createdAt: number; // timestamp
  updatedAt?: number; // timestamp for local updates
  isSynced: boolean;
  firestoreId: string | null; // ID from Firestore after syncing
};

export type SetlistWithSyncStatus = Setlist & {
  containsCustomSongs: boolean;
  needsSync: boolean; // Local is newer than cloud
};

interface RhythmicReadsDB extends DBSchema {
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

let dbPromise: Promise<IDBPDatabase<RhythmicReadsDB>> | null = null;

function getDb(): Promise<IDBPDatabase<RhythmicReadsDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RhythmicReadsDB>(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion, newVersion, transaction) {
        if (oldVersion < 1) {
            if (!db.objectStoreNames.contains(SONGS_STORE)) {
                db.createObjectStore(SONGS_STORE, { keyPath: 'id' });
            }
            if (!db.objectStoreNames.contains(SETLISTS_STORE)) {
                const setlistStore = db.createObjectStore(SETLISTS_STORE, { keyPath: 'id' });
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
    const songToUpdate = { ...song, updatedAt: new Date() };
    await db.put(SONGS_STORE, songToUpdate);
}

export async function getSong(id: string): Promise<Song | undefined> {
  const db = await getDb();
  return db.get(SONGS_STORE, id);
}

export async function deleteSong(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(SONGS_STORE, id);
}

export async function isSongSaved(id: string): Promise<{ saved: boolean; needsUpdate: boolean }> {
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
  const localVersionDate = savedSong.updatedAt ? new Date(savedSong.updatedAt).getTime() : 0;

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
    if (!firestoreDb) throw new Error("Firebase is not configured.");
    
    const { updatedAt, ...songData } = song;

    const dataToUpload = {
        ...songData,
        updatedAt: serverTimestamp(), // Use Firestore server timestamp for consistency
    };

    try {
        const songDocRef = doc(firestoreDb, "songs", dataToUpload.id);
        await setDoc(songDocRef, dataToUpload, { merge: true }); // Use setDoc with merge to create or update
    } catch (e: any) {
        console.error("Error uploading song to cloud:", e);
        if (e.code === 'permission-denied') {
            throw new Error("You do not have permission to upload songs.");
        }
        throw new Error("Failed to upload song to the cloud.");
    }
}

export async function getAllCloudSongs(): Promise<Song[]> {
    if (!firestoreDb) throw new Error("Firebase is not configured.");

    const songsCollection = collection(firestoreDb, "songs");
    const q = query(songsCollection, orderBy("title"));
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
            updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate() : new Date(),
        } as Song);
    });

    return songs;
}

export async function getCloudSongById(songId: string): Promise<Song | null> {
    if (!firestoreDb) throw new Error("Firebase is not configured.");
    
    try {
        const docRef = doc(firestoreDb, "songs", songId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            const data = docSnap.data();
            const updatedAt = data.updatedAt;
            return {
                id: docSnap.id,
                ...data,
                updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate() : new Date(),
            } as Song;
        } else {
            console.log("No such document!");
            return null;
        }
    } catch (error) {
        console.error("Error getting cloud song:", error);
        return null;
    }
}

export async function deleteCloudSong(songId: string): Promise<void> {
    if (!firestoreDb) throw new Error("Firebase is not configured.");
    try {
        const songDocRef = doc(firestoreDb, "songs", songId);
        await deleteDoc(songDocRef);
    } catch (e: any) {
        console.error("Error deleting song from cloud:", e);
        if (e.code === 'permission-denied') {
            throw new Error("You do not have permission to delete songs.");
        }
        throw new Error("Failed to delete song from the cloud.");
    }
}


// --- Setlist Functions ---

export async function saveSetlist(setlist: Setlist): Promise<void> {
  const db = await getDb();
  const setlistToSave: Setlist = {
      ...setlist,
      updatedAt: Date.now() // Ensure updatedAt is always set on save/update
  }
  await db.put(SETLISTS_STORE, setlistToSave);
}

export async function getSetlists(userId: string): Promise<SetlistWithSyncStatus[]> {
  if (!firestoreDb) {
      const db = await getDb();
      const localSetlists = await db.getAllFromIndex(SETLISTS_STORE, 'by-userId', userId);
      return localSetlists.map(sl => ({
          ...sl,
          containsCustomSongs: sl.songIds.some(id => id.startsWith('custom-')),
          needsSync: false // No firestore, no sync needed
      }));
  }

  // 1. Fetch from both sources
  const db = await getDb();
  const localSetlistsPromise = db.getAllFromIndex(SETLISTS_STORE, 'by-userId', userId);
  const firestoreQuery = query(collection(firestoreDb, "setlists"), where("userId", "==", userId));
  const firestoreSnapshotPromise = getDocs(firestoreQuery);

  const [localSetlists, firestoreSnapshot] = await Promise.all([localSetlistsPromise, firestoreSnapshotPromise]);

  const allSetlists = new Map<string, SetlistWithSyncStatus>();

  // 2. Process Firestore setlists first (source of truth for synced items)
  for (const doc of firestoreSnapshot.docs) {
      const data = doc.data();
      const firestoreTimestamp = (data.syncedAt as Timestamp)?.toMillis() || 0;

      const localEquivalent = localSetlists.find(l => l.firestoreId === doc.id);
      
      const setlist: Setlist = {
          id: localEquivalent?.id || `local-${doc.id}`,
          firestoreId: doc.id,
          title: data.title,
          songIds: data.songIds,
          userId: data.userId,
          createdAt: localEquivalent?.createdAt || firestoreTimestamp,
          updatedAt: localEquivalent?.updatedAt,
          isSynced: true,
      };

      // If local version doesn't exist, create it.
      if (!localEquivalent) {
          await db.put(SETLISTS_STORE, setlist);
      }

      allSetlists.set(setlist.id, {
          ...setlist,
          containsCustomSongs: false, // Cloud setlists can't have custom songs
          needsSync: (localEquivalent?.updatedAt || 0) > firestoreTimestamp,
      });
  }

  // 3. Process local-only setlists
  for (const setlist of localSetlists) {
      if (!setlist.firestoreId && !allSetlists.has(setlist.id)) {
          allSetlists.set(setlist.id, {
              ...setlist,
              containsCustomSongs: setlist.songIds.some(id => id.startsWith('custom-')),
              needsSync: false, // It's local only, can't "need" sync until user initiates.
          });
      }
  }
  
  return Array.from(allSetlists.values());
}


export async function getSetlist(id: string): Promise<Setlist | undefined> {
    const db = await getDb();
    return db.get(SETLISTS_STORE, id);
}

export async function getSetlistByFirestoreId(firestoreId: string): Promise<Setlist | null> {
    if (!firestoreDb) throw new Error("Firebase is not configured.");
    
    try {
        const docRef = doc(firestoreDb, "setlists", firestoreId);
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
            };
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error getting shared setlist:", error);
        return null;
    }
}

export async function deleteSetlist(id: string, userId: string): Promise<void> {
    const db = await getDb();
    const setlistToDelete = await db.get(SETLISTS_STORE, id);
    
    if (setlistToDelete?.userId !== userId) {
        throw new Error("Unauthorized to delete this setlist.");
    }
    
    // If it's synced, delete from Firestore first
    if (firestoreDb && setlistToDelete && setlistToDelete.isSynced && setlistToDelete.firestoreId) {
        await deleteDoc(doc(firestoreDb, "setlists", setlistToDelete.firestoreId));
    }
    
    await db.delete(SETLISTS_STORE, id);
}


export async function getSyncedSetlistsCount(userId: string): Promise<number> {
    if (!firestoreDb) return 0;
    const q = query(collection(firestoreDb, "setlists"), where("userId", "==", userId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
}

export async function syncSetlist(setlistId: string, userId: string): Promise<void> {
    if (!firestoreDb) throw new Error("Firebase is not configured.");

    const db = await getDb();
    const setlist = await db.get(SETLISTS_STORE, setlistId);

    if (!setlist) throw new Error("Setlist not found locally.");
    if (setlist.userId !== userId) throw new Error("Unauthorized");

    if (setlist.songIds.some(id => id.startsWith('custom-'))) {
        throw new Error("Cannot sync setlists with custom songs.");
    }

    const dataToSync = {
        title: setlist.title,
        songIds: setlist.songIds,
        userId: setlist.userId,
        syncedAt: serverTimestamp(),
    };

    if (setlist.isSynced && setlist.firestoreId) {
        const docRef = doc(firestoreDb, "setlists", setlist.firestoreId);
        await updateDoc(docRef, dataToSync);
    } else {
        const count = await getSyncedSetlistsCount(userId);
        if (count >= SYNC_LIMIT) {
            throw new Error("SYNC_LIMIT_REACHED");
        }
        const newDocRef = doc(collection(firestoreDb, "setlists"));
        await setDoc(newDocRef, dataToSync);
        setlist.firestoreId = newDocRef.id;
    }

    setlist.isSynced = true;
    setlist.updatedAt = Date.now();
    await db.put(SETLISTS_STORE, setlist);
}


export async function unsyncSetlist(localId: string, userId: string, firestoreId: string): Promise<void> {
     if (!firestoreDb) throw new Error("Firebase is not configured.");
     const db = await getDb();
     const setlist = await db.get(SETLISTS_STORE, localId);

     if (!setlist) throw new Error("Setlist not found locally.");
     if (setlist.userId !== userId) throw new Error("Unauthorized");
     if (!setlist.isSynced || setlist.firestoreId !== firestoreId) {
         throw new Error("Sync mismatch.");
     }

     await deleteDoc(doc(firestoreDb, "setlists", firestoreId));

     setlist.isSynced = false;
     setlist.firestoreId = null;
     await db.put(SETLISTS_STORE, setlist);
}

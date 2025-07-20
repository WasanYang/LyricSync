
// src/lib/db.ts
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Song } from './songs';
import { db as firestoreDb } from './firebase'; 
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, serverTimestamp, writeBatch } from 'firebase/firestore';


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
  isSynced: boolean;
  firestoreId: string | null; // ID from Firestore after syncing
};

export type SetlistWithSyncStatus = Setlist & {
  containsCustomSongs: boolean;
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
  
  const { getSongById } = await import('./songs');
  const latestSong = getSongById(id);

  if (!latestSong) {
     return { saved: true, needsUpdate: false };
  }

  const cloudVersionDate = new Date(latestSong.updatedAt).getTime();
  const localVersionDate = new Date(savedSong.updatedAt).getTime();

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


// --- Setlist Functions ---

export async function saveSetlist(setlist: Setlist): Promise<void> {
  const db = await getDb();
  await db.put(SETLISTS_STORE, setlist);
}

export async function getSetlists(userId: string): Promise<SetlistWithSyncStatus[]> {
  const db = await getDb();
  const localSetlists = await db.getAllFromIndex(SETLISTS_STORE, 'by-userId', userId);
  
  const setlistsWithStatus = localSetlists.map(setlist => {
      const containsCustom = setlist.songIds.some(id => id.startsWith('custom-'));
      return {
          ...setlist,
          containsCustomSongs: containsCustom
      }
  });

  return setlistsWithStatus;
}


export async function getSetlist(id: string): Promise<Setlist | undefined> {
    const db = await getDb();
    return db.get(SETLISTS_STORE, id);
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
    if (setlist.isSynced) return; // Already synced

    // Check for custom songs
    if (setlist.songIds.some(id => id.startsWith('custom-'))) {
        throw new Error("Cannot sync setlists with custom songs.");
    }

    // Check sync limit
    const count = await getSyncedSetlistsCount(userId);
    if (count >= SYNC_LIMIT) {
        throw new Error("SYNC_LIMIT_REACHED");
    }

    const docRef = await addDoc(collection(firestoreDb, "setlists"), {
        title: setlist.title,
        songIds: setlist.songIds,
        userId: setlist.userId,
        syncedAt: serverTimestamp()
    });

    // Update local setlist
    setlist.isSynced = true;
    setlist.firestoreId = docRef.id;
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

    
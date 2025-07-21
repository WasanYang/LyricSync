
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
            updatedAt: updatedAt instanceof Timestamp ? updatedAt.toDate() : new Date(),
        } as Song);
    });

    return songs;
}


// --- Setlist Functions ---

export async function saveSetlist(setlist: Setlist): Promise<void> {
  const db = await getDb();
  const setlistToSave: Setlist = {
      ...setlist,
      updatedAt: Date.now() // Ensure updatedAt is always set on save/update
  }
  // If it's already synced, mark it as needing a sync after edit
  if (setlistToSave.isSynced) {
    // The logic to compare dates will handle the 'needsSync' flag display
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

  const db = await getDb();
  const localSetlists = await db.getAllFromIndex(SETLISTS_STORE, 'by-userId', userId);
  
  const setlistsWithStatusPromises = localSetlists.map(async (setlist) => {
    const containsCustom = setlist.songIds.some(id => id.startsWith('custom-'));
    let needsSync = false;

    if (setlist.isSynced && setlist.firestoreId) {
        try {
            const docRef = doc(firestoreDb, "setlists", setlist.firestoreId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                const firestoreData = docSnap.data();
                const firestoreTimestamp = firestoreData.syncedAt?.toMillis() || 0;
                const localTimestamp = setlist.updatedAt || setlist.createdAt;
                if (localTimestamp > firestoreTimestamp) {
                    needsSync = true;
                }
            } else {
                // The doc was deleted on another device. Mark for re-sync.
                needsSync = true;
            }
        } catch (e) {
            console.error("Could not check sync status for setlist:", setlist.id, e);
            // Assume it needs sync if check fails
            needsSync = true;
        }
    } else if (!setlist.isSynced) {
        // Local only, so it "needs sync" if the user wants it online
        needsSync = true; 
    }

    return {
        ...setlist,
        containsCustomSongs: containsCustom,
        needsSync: setlist.isSynced ? needsSync : false // Only synced items can need an update sync
    }
  });

  return Promise.all(setlistsWithStatusPromises);
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

    // Check for custom songs
    if (setlist.songIds.some(id => id.startsWith('custom-'))) {
        throw new Error("Cannot sync setlists with custom songs.");
    }
    
    const dataToSync = {
        title: setlist.title,
        songIds: setlist.songIds,
        userId: setlist.userId,
        syncedAt: serverTimestamp() // This is Firestore's server-side timestamp
    };

    if (setlist.isSynced && setlist.firestoreId) {
        // It's an update to an existing synced setlist
        const docRef = doc(firestoreDb, "setlists", setlist.firestoreId);
        await updateDoc(docRef, dataToSync);
    } else {
        // It's a new sync
        // Check sync limit
        const count = await getSyncedSetlistsCount(userId);
        if (count >= SYNC_LIMIT) {
            throw new Error("SYNC_LIMIT_REACHED");
        }
        const docRef = await addDoc(collection(firestoreDb, "setlists"), dataToSync);
        setlist.firestoreId = docRef.id;
    }
    
    // Update local setlist
    setlist.isSynced = true;
    setlist.updatedAt = Date.now(); // Mark local as up-to-date with this sync
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

    

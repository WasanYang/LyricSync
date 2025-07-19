
// src/lib/db.ts
import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Song } from './songs';

const DB_NAME = 'RhythmicReadsDB';
const DB_VERSION = 1;
const SONGS_STORE = 'songs';
const SETLISTS_STORE = 'setlists';

export type Setlist = {
  id: string;
  title: string;
  songIds: string[];
};

interface RhythmicReadsDB extends DBSchema {
  [SONGS_STORE]: {
    key: string;
    value: Song;
  };
  [SETLISTS_STORE]: {
    key: string;
    value: Setlist;
    indexes: { 'by-title': string };
  };
}

let dbPromise: Promise<IDBPDatabase<RhythmicReadsDB>> | null = null;

function getDb(): Promise<IDBPDatabase<RhythmicReadsDB>> {
  if (!dbPromise) {
    dbPromise = openDB<RhythmicReadsDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(SONGS_STORE)) {
          db.createObjectStore(SONGS_STORE, { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains(SETLISTS_STORE)) {
          const setlistStore = db.createObjectStore(SETLISTS_STORE, { keyPath: 'id' });
          setlistStore.createIndex('by-title', 'title');
        }
      },
    });
  }
  return dbPromise;
}

// --- Song Functions ---

export async function saveSong(song: Song): Promise<void> {
  const db = await getDb();
  await db.put(SONGS_STORE, song);
}

export async function updateSong(song: Song): Promise<void> {
    const db = await getDb();
    await db.put(SONGS_STORE, song);
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
  
  // This assumes getSongById from songs.ts gives the latest version
  const { getSongById } = await import('./songs');
  const latestSong = getSongById(id);

  if (!latestSong) {
     return { saved: true, needsUpdate: false }; // Should not happen if data is consistent
  }

  const savedDate = new Date(savedSong.updatedAt).getTime();
  const latestDate = new Date(latestSong.updatedAt).getTime();

  return { saved: true, needsUpdate: latestDate > savedDate };
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

export async function getSetlists(): Promise<Setlist[]> {
  const db = await getDb();
  return db.getAll(SETLISTS_STORE);
}

export async function getSetlist(id: string): Promise<Setlist | undefined> {
    const db = await getDb();
    return db.get(SETLISTS_STORE, id);
}

export async function deleteSetlist(id: string): Promise<void> {
    const db = await getDb();
    await db.delete(SETLISTS_STORE, id);
}

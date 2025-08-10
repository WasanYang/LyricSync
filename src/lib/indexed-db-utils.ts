// src/lib/indexed-db-utils.ts
import { openDB, type IDBPDatabase } from 'idb';
import type { Setlist, Song } from '@/lib/db';

const DB_NAME = 'LyricSyncDB';
const DB_VERSION = 2;
const SONGS_STORE = 'songs';
const SETLISTS_STORE = 'setlists';

let dbPromise: Promise<IDBPDatabase> | null = null;

function getDb(): Promise<IDBPDatabase> {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        if (oldVersion < 1) {
          db.createObjectStore(SONGS_STORE, { keyPath: 'id' });
          db.createObjectStore(SETLISTS_STORE, { keyPath: 'id' });
        }
        if (oldVersion < 2) {
          if (!db.objectStoreNames.contains(SETLISTS_STORE)) {
            db.createObjectStore(SETLISTS_STORE, { keyPath: 'id' });
          }
        }
      },
    });
  }
  return dbPromise;
}

// --- Setlist Functions ---

export async function saveLocalSetlist(setlist: Setlist): Promise<void> {
  const db = await getDb();
  await db.put(SETLISTS_STORE, setlist);
}

export async function getLocalSetlists(userId: string): Promise<Setlist[]> {
  const db = await getDb();
  const allSetlists = await db.getAll(SETLISTS_STORE);
  // Filter by userId on the client side
  return allSetlists.filter((s) => s.userId === userId);
}

export async function getLocalSetlist(id: string): Promise<Setlist | undefined> {
  const db = await getDb();
  return db.get(SETLISTS_STORE, id);
}

export async function deleteLocalSetlist(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(SETLISTS_STORE, id);
}

// --- Song Functions (if needed for offline drafts in the future) ---

export async function saveLocalSong(song: Song): Promise<void> {
  const db = await getDb();
  await db.put(SONGS_STORE, song);
}

export async function getLocalSong(id: string): Promise<Song | undefined> {
  const db = await getDb();
  return db.get(SONGS_STORE, id);
}

export async function getAllLocalSongs(): Promise<Song[]> {
  const db = await getDb();
  return db.getAll(SONGS_STORE);
}

export async function deleteLocalSong(id: string): Promise<void> {
  const db = await getDb();
  await db.delete(SONGS_STORE, id);
}

export const indexedDBManager = {
  saveSetlist: saveLocalSetlist,
  getSetlists: getLocalSetlists,
  getSetlist: getLocalSetlist,
  deleteSetlist: deleteLocalSetlist,
  saveSong: saveLocalSong,
  getSong: getLocalSong,
  getAllSongs: getAllLocalSongs,
  deleteSong: deleteLocalSong,
  initialize: getDb, // To ensure DB is ready
};

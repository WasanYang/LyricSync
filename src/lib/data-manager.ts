// src/lib/data-manager.ts
// Firebase-First Data Manager with Smart Caching

import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  DocumentData,
  Firestore,
} from 'firebase/firestore';
import { db } from './firebase';
import type { Song, Setlist, User } from './types/database';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class DataManager {
  private cache = new Map<string, CacheEntry<any>>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly LONG_TTL = 30 * 60 * 1000; // 30 minutes for static content

  private getFirestore(): Firestore {
    if (!db) {
      throw new Error('Firebase not initialized');
    }
    return db;
  }

  // Memory cache management
  private isExpired<T>(entry: CacheEntry<T>): boolean {
    return Date.now() > entry.timestamp + entry.ttl;
  }

  private setCache<T>(
    key: string,
    data: T,
    ttl: number = this.DEFAULT_TTL
  ): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T>;
    if (!entry || this.isExpired(entry)) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  // Songs
  async getSong(id: string): Promise<Song | null> {
    const cacheKey = `song:${id}`;
    const cached = this.getCache<Song>(cacheKey);
    if (cached) return cached;

    if (!db) {
      throw new Error('Firebase not initialized');
    }

    try {
      const songDoc = await getDoc(doc(db, 'songs', id));
      if (!songDoc.exists()) return null;

      const song = { id: songDoc.id, ...songDoc.data() } as Song;
      this.setCache(cacheKey, song, this.LONG_TTL); // Songs change less frequently
      return song;
    } catch (error) {
      console.error('Error fetching song:', error);
      return null;
    }
  }

  async getPublicSongs(limitCount: number = 50): Promise<Song[]> {
    const cacheKey = `public-songs:${limitCount}`;
    const cached = this.getCache<Song[]>(cacheKey);
    if (cached) return cached;

    const firestore = this.getFirestore();

    try {
      const q = query(
        collection(firestore, 'songs'),
        where('isPublic', '==', true),
        where('isSynced', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const songs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Song[];

      this.setCache(cacheKey, songs);
      return songs;
    } catch (error) {
      console.error('Error fetching public songs:', error);
      return [];
    }
  }

  async getUserSongs(userId: string): Promise<Song[]> {
    const cacheKey = `user-songs:${userId}`;
    const cached = this.getCache<Song[]>(cacheKey);
    if (cached) return cached;

    const firestore = this.getFirestore();

    try {
      const q = query(
        collection(firestore, 'songs'),
        where('createdBy', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const songs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Song[];

      this.setCache(cacheKey, songs);
      return songs;
    } catch (error) {
      console.error('Error fetching user songs:', error);
      return [];
    }
  }

  // Setlists
  async getSetlist(id: string): Promise<Setlist | null> {
    const cacheKey = `setlist:${id}`;
    const cached = this.getCache<Setlist>(cacheKey);
    if (cached) return cached;

    const firestore = this.getFirestore();

    try {
      const setlistDoc = await getDoc(doc(firestore, 'setlists', id));
      if (!setlistDoc.exists()) return null;

      const setlist = { id: setlistDoc.id, ...setlistDoc.data() } as Setlist;
      this.setCache(cacheKey, setlist);
      return setlist;
    } catch (error) {
      console.error('Error fetching setlist:', error);
      return null;
    }
  }

  async getSetlistByFirestoreId(firestoreId: string): Promise<Setlist | null> {
    const cacheKey = `setlist-firestore:${firestoreId}`;
    const cached = this.getCache<Setlist>(cacheKey);
    if (cached) return cached;

    const firestore = this.getFirestore();

    try {
      const q = query(
        collection(firestore, 'setlists'),
        where('firestoreId', '==', firestoreId),
        limit(1)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const doc = snapshot.docs[0];
      const setlist = { id: doc.id, ...doc.data() } as Setlist;
      this.setCache(cacheKey, setlist);
      return setlist;
    } catch (error) {
      console.error('Error fetching setlist by firestore ID:', error);
      return null;
    }
  }

  async getPublicSetlists(limitCount: number = 20): Promise<Setlist[]> {
    const cacheKey = `public-setlists:${limitCount}`;
    const cached = this.getCache<Setlist[]>(cacheKey);
    if (cached) return cached;

    const firestore = this.getFirestore();

    try {
      const q = query(
        collection(firestore, 'setlists'),
        where('isPublic', '==', true),
        where('isSynced', '==', true),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      const setlists = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Setlist[];

      this.setCache(cacheKey, setlists);
      return setlists;
    } catch (error) {
      console.error('Error fetching public setlists:', error);
      return [];
    }
  }

  async getUserSetlists(userId: string): Promise<Setlist[]> {
    const cacheKey = `user-setlists:${userId}`;
    const cached = this.getCache<Setlist[]>(cacheKey);
    if (cached) return cached;

    const firestore = this.getFirestore();

    try {
      const q = query(
        collection(firestore, 'setlists'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const setlists = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Setlist[];

      this.setCache(cacheKey, setlists);
      return setlists;
    } catch (error) {
      console.error('Error fetching user setlists:', error);
      return [];
    }
  }

  // Smart preloading
  async preloadUserFavorites(userId: string): Promise<void> {
    try {
      // Preload user's most recent content
      const [songs, setlists] = await Promise.all([
        this.getUserSongs(userId),
        this.getUserSetlists(userId),
      ]);

      // Preload songs from recent setlists
      const recentSetlists = setlists.slice(0, 3);
      const songIds = [...new Set(recentSetlists.flatMap((s) => s.songIds))];

      await Promise.all(songIds.slice(0, 10).map((id) => this.getSong(id)));

      console.log('Preloaded user favorites');
    } catch (error) {
      console.error('Error preloading user favorites:', error);
    }
  }

  // Real-time subscriptions
  subscribeToUserContent(
    userId: string,
    onSongsChange: (songs: Song[]) => void,
    onSetlistsChange: (setlists: Setlist[]) => void
  ) {
    const firestore = this.getFirestore();

    // Subscribe to user songs
    const songsQuery = query(
      collection(firestore, 'songs'),
      where('createdBy', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const songsUnsubscribe = onSnapshot(songsQuery, (snapshot) => {
      const songs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Song[];

      // Update cache
      this.setCache(`user-songs:${userId}`, songs);
      onSongsChange(songs);
    });

    // Subscribe to user setlists
    const setlistsQuery = query(
      collection(firestore, 'setlists'),
      where('userId', '==', userId),
      orderBy('updatedAt', 'desc')
    );

    const setlistsUnsubscribe = onSnapshot(setlistsQuery, (snapshot) => {
      const setlists = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Setlist[];

      // Update cache
      this.setCache(`user-setlists:${userId}`, setlists);
      onSetlistsChange(setlists);
    });

    return () => {
      songsUnsubscribe();
      setlistsUnsubscribe();
    };
  }

  // Cache invalidation
  invalidateCache(pattern: string): void {
    const keysToDelete = Array.from(this.cache.keys()).filter((key) =>
      key.includes(pattern)
    );

    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  clearCache(): void {
    this.cache.clear();
  }

  // Get cache stats
  getCacheStats() {
    const entries = Array.from(this.cache.entries());
    const activeEntries = entries.filter(([, entry]) => !this.isExpired(entry));

    return {
      totalEntries: this.cache.size,
      activeEntries: activeEntries.length,
      expiredEntries: entries.length - activeEntries.length,
      memoryUsage: JSON.stringify(Array.from(this.cache)).length,
    };
  }
}

// Singleton instance
export const dataManager = new DataManager();

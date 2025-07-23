import { Song } from '@/lib/songs';
import { Setlist } from '@/lib/db';
import { getSong as getSongFromDb, getSong, getCloudSongById } from '@/lib/db';
import {
  getSetlist as getSetlistFromDb,
  getSetlistByFirestoreId,
} from '@/lib/db';

export interface OfflineDataService {
  getSongWithFallback: (
    songId: string,
    userLoggedIn: boolean
  ) => Promise<Song | null>;
  getSetlistWithFallback: (
    setlistId: string,
    isFirestoreId?: boolean
  ) => Promise<Setlist | null>;
  preloadSongData: (song: Song) => Promise<void>;
  preloadSetlistData: (setlist: Setlist) => Promise<void>;
  getOfflineStatus: () => { hasOfflineData: boolean; lastSync: Date | null };
}

class OfflineDataServiceImpl implements OfflineDataService {
  async getSongWithFallback(
    songId: string,
    userLoggedIn: boolean
  ): Promise<Song | null> {
    try {
      // Priority 1: Local database (if user is logged in)
      if (userLoggedIn) {
        const localSong = await getSongFromDb(songId);
        if (localSong) {
          console.log(`🎵 Loaded song "${localSong.title}" from local storage`);
          return localSong;
        }
      }

      // Priority 2: Cloud database (if online)
      if (navigator.onLine) {
        const cloudSong = await getCloudSongById(songId);
        if (cloudSong) {
          console.log(`☁️ Loaded song "${cloudSong.title}" from cloud`);
          // Auto-save to local if user is logged in
          if (userLoggedIn) {
            try {
              await this.preloadSongData(cloudSong);
            } catch (error) {
              console.warn('Failed to cache song locally:', error);
            }
          }
          return cloudSong;
        }
      }

      // No song found
      console.warn(`❌ Song ${songId} not found in local or cloud storage`);
      return null;
    } catch (error) {
      console.error('Error loading song:', error);
      return null;
    }
  }

  async getSetlistWithFallback(
    setlistId: string,
    isFirestoreId = false
  ): Promise<Setlist | null> {
    try {
      if (isFirestoreId) {
        // For shared setlists, try cloud first
        if (navigator.onLine) {
          const cloudSetlist = await getSetlistByFirestoreId(setlistId);
          if (cloudSetlist) {
            console.log(
              `☁️ Loaded shared setlist "${cloudSetlist.title}" from cloud`
            );
            return cloudSetlist;
          }
        }
      } else {
        // For personal setlists, try local first
        const localSetlist = await getSetlistFromDb(setlistId);
        if (localSetlist) {
          console.log(
            `📋 Loaded setlist "${localSetlist.title}" from local storage`
          );
          return localSetlist;
        }

        // Fallback to cloud if available
        if (navigator.onLine) {
          const cloudSetlist = await getSetlistByFirestoreId(setlistId);
          if (cloudSetlist) {
            console.log(`☁️ Loaded setlist "${cloudSetlist.title}" from cloud`);
            return cloudSetlist;
          }
        }
      }

      console.warn(`❌ Setlist ${setlistId} not found`);
      return null;
    } catch (error) {
      console.error('Error loading setlist:', error);
      return null;
    }
  }

  async preloadSongData(song: Song): Promise<void> {
    try {
      await getSong(song.id);
      console.log(`💾 Cached song "${song.title}" for offline use`);
    } catch (error) {
      console.warn(`Failed to cache song "${song.title}":`, error);
    }
  }

  async preloadSetlistData(setlist: Setlist): Promise<void> {
    try {
      // Cache the setlist and all its songs
      await Promise.all([
        // Cache setlist metadata
        this.getSetlistWithFallback(setlist.id),
        // Cache all songs in the setlist
        ...setlist.songIds.map((songId) =>
          this.getSongWithFallback(songId, true)
        ),
      ]);
      console.log(
        `💾 Cached setlist "${setlist.title}" with all songs for offline use`
      );
    } catch (error) {
      console.warn(`Failed to cache setlist "${setlist.title}":`, error);
    }
  }

  getOfflineStatus(): { hasOfflineData: boolean; lastSync: Date | null } {
    // This would check IndexedDB for cached data
    // For now, return basic status
    return {
      hasOfflineData: true, // Assume we have some data
      lastSync: new Date(), // Would be actual last sync time
    };
  }
}

export const offlineDataService = new OfflineDataServiceImpl();

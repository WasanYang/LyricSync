import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { offlineDataService } from '@/lib/offline-service';
import type { Song } from '@/lib/songs';
import type { Setlist } from '@/lib/db';

interface LoadingState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  fromCache: boolean;
}

export function useSafeLoader<T>(
  loadFn: () => Promise<T | null>,
  dependencies: any[] = []
) {
  const [state, setState] = useState<LoadingState<T>>({
    data: null,
    loading: true,
    error: null,
    fromCache: false,
  });

  const load = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await loadFn();
      setState({
        data: result,
        loading: false,
        error: null,
        fromCache: false, // Would need to be determined by loadFn
      });
    } catch (error: any) {
      setState({
        data: null,
        loading: false,
        error: error.message || 'Failed to load data',
        fromCache: false,
      });
    }
  }, [loadFn]);

  useEffect(() => {
    load();
  }, dependencies);

  return {
    ...state,
    reload: load,
  };
}

export function useSafeSong(songId: string) {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();

  return useSafeLoader(async () => {
    if (!songId) return null;
    return await offlineDataService.getSongWithFallback(songId, !!user);
  }, [songId, user, isOnline]);
}

export function useSafeSetlist(setlistId: string, isFirestoreId = false) {
  const isOnline = useOnlineStatus();

  return useSafeLoader(async () => {
    if (!setlistId) return null;
    return await offlineDataService.getSetlistWithFallback(
      setlistId,
      isFirestoreId
    );
  }, [setlistId, isFirestoreId, isOnline]);
}

export function useSafeSetlistSongs(setlist: Setlist | null) {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();

  return useSafeLoader(async () => {
    if (!setlist) return [];

    const songPromises = setlist.songIds.map((songId) =>
      offlineDataService.getSongWithFallback(songId, !!user)
    );

    const songs = await Promise.all(songPromises);
    return songs.filter((song): song is Song => song !== null);
  }, [setlist, user, isOnline]);
}

// Hook for batch loading and caching
export function useBatchPreloader() {
  const [isPreloading, setIsPreloading] = useState(false);
  const [preloadProgress, setPreloadProgress] = useState(0);

  const preloadSetlistWithSongs = useCallback(async (setlist: Setlist) => {
    setIsPreloading(true);
    setPreloadProgress(0);

    try {
      const total = setlist.songIds.length + 1; // +1 for setlist itself
      let completed = 0;

      // Preload setlist
      await offlineDataService.preloadSetlistData(setlist);
      completed++;
      setPreloadProgress((completed / total) * 100);

      // Preload all songs
      for (const songId of setlist.songIds) {
        try {
          const song = await offlineDataService.getSongWithFallback(
            songId,
            true
          );
          if (song) {
            await offlineDataService.preloadSongData(song);
          }
        } catch (error) {
          console.warn(`Failed to preload song ${songId}:`, error);
        }
        completed++;
        setPreloadProgress((completed / total) * 100);
      }

      console.log(
        `✅ Successfully preloaded setlist "${setlist.title}" for offline use`
      );
    } catch (error) {
      console.error('Batch preload failed:', error);
      throw error;
    } finally {
      setIsPreloading(false);
      setPreloadProgress(0);
    }
  }, []);

  return {
    preloadSetlistWithSongs,
    isPreloading,
    preloadProgress,
  };
}

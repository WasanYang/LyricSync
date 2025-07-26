// src/hooks/use-data-manager.ts
// React hooks for Firebase-First Data Manager

import { useState, useEffect, useCallback } from 'react';
import { dataManager } from '@/lib/data-manager';
import { localStorageManager } from '@/lib/local-storage';
import { indexedDBManager } from '@/lib/indexed-db-utils';
import type { Song, Setlist } from '@/lib/types/database';

// Hook for songs
export function useSong(id: string) {
  const [song, setSong] = useState<Song | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchSong = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await dataManager.getSong(id);

        if (!cancelled) {
          setSong(result);

          // Log activity
          if (result) {
            indexedDBManager.logActivity({
              userId: 'current-user', // Should get from auth context
              action: 'play',
              resourceType: 'song',
              resourceId: id,
              metadata: { title: result.title, artist: result.artist },
            });

            // Add to recent songs
            localStorageManager.addToRecentSongs(id);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load song');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSong();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const refresh = useCallback(async () => {
    // Invalidate cache and refetch
    dataManager.invalidateCache(`song:${id}`);
    setLoading(true);

    try {
      const result = await dataManager.getSong(id);
      setSong(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh song');
    } finally {
      setLoading(false);
    }
  }, [id]);

  return { song, loading, error, refresh };
}

// Hook for setlists
export function useSetlist(id: string) {
  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchSetlist = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await dataManager.getSetlist(id);

        if (!cancelled) {
          setSetlist(result);

          // Log activity and add to recent
          if (result) {
            indexedDBManager.logActivity({
              userId: 'current-user',
              action: 'play',
              resourceType: 'setlist',
              resourceId: id,
              metadata: {
                title: result.title,
                songCount: result.songIds.length,
              },
            });

            localStorageManager.addToRecentSetlists(id);
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load setlist'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSetlist();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const refresh = useCallback(async () => {
    dataManager.invalidateCache(`setlist:${id}`);
    setLoading(true);

    try {
      const result = await dataManager.getSetlist(id);
      setSetlist(result);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to refresh setlist'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  return { setlist, loading, error, refresh };
}

// Hook for public songs
export function usePublicSongs(limit: number = 50) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchSongs = async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await dataManager.getPublicSongs(limit);

        if (!cancelled) {
          setSongs(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load songs');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchSongs();

    return () => {
      cancelled = true;
    };
  }, [limit]);

  const refresh = useCallback(async () => {
    dataManager.invalidateCache(`public-songs:${limit}`);
    setLoading(true);

    try {
      const result = await dataManager.getPublicSongs(limit);
      setSongs(result);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to refresh songs');
    } finally {
      setLoading(false);
    }
  }, [limit]);

  return { songs, loading, error, refresh };
}

// Hook for user's content with real-time updates
export function useUserContent(userId: string) {
  const [songs, setSongs] = useState<Song[]>([]);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;

    const initializeData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Initial load
        const [initialSongs, initialSetlists] = await Promise.all([
          dataManager.getUserSongs(userId),
          dataManager.getUserSetlists(userId),
        ]);

        if (!cancelled) {
          setSongs(initialSongs);
          setSetlists(initialSetlists);
        }

        // Preload user favorites
        dataManager.preloadUserFavorites(userId);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Failed to load user content'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    // Set up real-time subscription
    const unsubscribe = dataManager.subscribeToUserContent(
      userId,
      (updatedSongs) => {
        if (!cancelled) {
          setSongs(updatedSongs);
        }
      },
      (updatedSetlists) => {
        if (!cancelled) {
          setSetlists(updatedSetlists);
        }
      }
    );

    initializeData();

    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [userId]);

  const refresh = useCallback(async () => {
    if (!userId) return;

    // Invalidate cache
    dataManager.invalidateCache(`user-songs:${userId}`);
    dataManager.invalidateCache(`user-setlists:${userId}`);

    setLoading(true);

    try {
      const [updatedSongs, updatedSetlists] = await Promise.all([
        dataManager.getUserSongs(userId),
        dataManager.getUserSetlists(userId),
      ]);

      setSongs(updatedSongs);
      setSetlists(updatedSetlists);
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to refresh user content'
      );
    } finally {
      setLoading(false);
    }
  }, [userId]);

  return { songs, setlists, loading, error, refresh };
}

// Hook for search with caching
export function useSearch() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(
    async (
      query: string,
      type: 'song' | 'setlist' | 'user'
    ): Promise<any[]> => {
      if (!query.trim()) return [];

      setLoading(true);
      setError(null);

      try {
        // Check cache first
        const cached = await indexedDBManager.getSearchCache(query, type);
        if (cached) {
          setLoading(false);
          return cached.results;
        }

        // Perform search based on type
        let results: any[] = [];

        if (type === 'song') {
          const allSongs = await dataManager.getPublicSongs(200);
          results = allSongs.filter(
            (song) =>
              song.title.toLowerCase().includes(query.toLowerCase()) ||
              song.artist.toLowerCase().includes(query.toLowerCase())
          );
        } else if (type === 'setlist') {
          const allSetlists = await dataManager.getPublicSetlists(100);
          results = allSetlists.filter(
            (setlist) =>
              setlist.title.toLowerCase().includes(query.toLowerCase()) ||
              setlist.authorName.toLowerCase().includes(query.toLowerCase())
          );
        }

        // Cache results
        await indexedDBManager.cacheSearch(query, results, type);

        // Add to search history
        localStorageManager.addToSearchHistory(query);

        setLoading(false);
        return results;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Search failed');
        setLoading(false);
        return [];
      }
    },
    []
  );

  return { search, loading, error };
}

// Hook for managing drafts
export function useDrafts(userId: string, type?: 'song' | 'setlist') {
  const [drafts, setDrafts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDrafts = async () => {
      try {
        const result = await indexedDBManager.getDrafts(userId, type);
        setDrafts(result);
      } catch (error) {
        console.error('Failed to load drafts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDrafts();
  }, [userId, type]);

  const saveDraft = useCallback(
    async (draft: any) => {
      try {
        const id = await indexedDBManager.saveDraft({
          type: draft.type,
          title: draft.title,
          content: draft.content,
          autoSaveEnabled: true,
          userId,
        });

        // Reload drafts
        const updated = await indexedDBManager.getDrafts(userId, type);
        setDrafts(updated);

        return id;
      } catch (error) {
        console.error('Failed to save draft:', error);
        throw error;
      }
    },
    [userId, type]
  );

  return { drafts, loading, saveDraft };
}

// Hook for performance monitoring
export function usePerformanceMonitor() {
  const logPerformance = useCallback(
    (pageData: { page: string; loadTime: number; renderTime?: number }) => {
      indexedDBManager.logPerformance({
        ...pageData,
        renderTime: pageData.renderTime || 0,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        userAgent: navigator.userAgent,
        deviceInfo: {
          platform: navigator.platform,
          isMobile: /Mobile|Android|iOS/.test(navigator.userAgent),
          screenSize: `${screen.width}x${screen.height}`,
        },
      });
    },
    []
  );

  return { logPerformance };
}

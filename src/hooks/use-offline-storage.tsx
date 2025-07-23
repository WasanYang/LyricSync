import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { offlineDataService } from '@/lib/offline-service';

export function useOfflineStorage() {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const [offlineStatus, setOfflineStatus] = useState({
    hasOfflineData: false,
    lastSync: null as Date | null,
    cachedSongsCount: 0,
    cachedSetlistsCount: 0,
  });

  useEffect(() => {
    async function updateOfflineStatus() {
      try {
        const status = offlineDataService.getOfflineStatus();
        setOfflineStatus((prev) => ({
          ...prev,
          ...status,
        }));
      } catch (error) {
        console.error('Failed to get offline status:', error);
      }
    }

    updateOfflineStatus();
  }, [user, isOnline]);

  const preloadForOffline = async (type: 'song' | 'setlist', data: any) => {
    try {
      if (type === 'song') {
        await offlineDataService.preloadSongData(data);
      } else if (type === 'setlist') {
        await offlineDataService.preloadSetlistData(data);
      }
    } catch (error) {
      console.error('Failed to preload data:', error);
      throw error;
    }
  };

  return {
    ...offlineStatus,
    isOnline,
    canUseOffline: !!user && offlineStatus.hasOfflineData,
    preloadForOffline,
  };
}

export function useSafeDataLoader() {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();

  const loadSong = useCallback(async (songId: string) => {
    return offlineDataService.getSongWithFallback(songId, !!user);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isOnline]);

  const loadSetlist = useCallback(async (setlistId: string, isFirestoreId = false) => {
    return offlineDataService.getSetlistWithFallback(setlistId, isFirestoreId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  return {
    loadSong,
    loadSetlist,
    isOnline,
    canLoadFromCloud: isOnline,
  };
}

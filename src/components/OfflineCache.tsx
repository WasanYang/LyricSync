import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { ArrowDown, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface OfflineCacheButtonProps {
  type: 'song' | 'setlist';
  data: any;
  size?: 'sm' | 'default' | 'lg';
  variant?: 'default' | 'outline' | 'ghost';
}

export function OfflineCacheButton({
  type,
  data,
  size = 'default',
  variant = 'outline',
}: OfflineCacheButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isCached, setIsCached] = useState(false);
  const { preloadForOffline, isOnline } = useOfflineStorage();
  const { toast } = useToast();

  const handleCache = async () => {
    if (!isOnline) {
      toast({
        title: 'No Internet Connection',
        description: 'You need to be online to cache content for offline use.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      await preloadForOffline(type, data);
      setIsCached(true);
      toast({
        title: 'Cached Successfully',
        description: `${type === 'song' ? 'Song' : 'Setlist'} "${
          data.title
        }" is now available offline.`,
      });
    } catch (error) {
      console.error('Failed to cache:', error);
      toast({
        title: 'Cache Failed',
        description: 'Could not cache this content for offline use.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isCached) {
    return (
      <Button size={size} variant='ghost' disabled className='text-green-600'>
        <RotateCcw className='w-4 h-4 mr-2' />
        Available Offline
      </Button>
    );
  }

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleCache}
      disabled={isLoading || !isOnline}
    >
      {isLoading ? (
        <RotateCcw className='w-4 h-4 mr-2 animate-spin' />
      ) : (
        <ArrowDown className='w-4 h-4 mr-2' />
      )}
      {isLoading ? 'Caching...' : 'Cache Offline'}
    </Button>
  );
}

interface OfflineStatusProps {
  className?: string;
}

export function OfflineStatus({ className }: OfflineStatusProps) {
  const { hasOfflineData, cachedSongsCount, cachedSetlistsCount, isOnline } =
    useOfflineStorage();

  return (
    <div className={className}>
      <div className='text-sm text-muted-foreground'>
        <div className='flex items-center gap-2 mb-2'>
          <div
            className={`h-2 w-2 rounded-full ${
              isOnline ? 'bg-green-500' : 'bg-amber-500'
            }`}
          />
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>
        {hasOfflineData && (
          <div className='space-y-1'>
            <p>{cachedSongsCount} songs cached</p>
            <p>{cachedSetlistsCount} setlists cached</p>
          </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  CheckCircle,
  AlertCircle,
  WifiOff,
  Wifi,
  Download,
  HardDrive,
} from 'lucide-react';
import { getAllSavedSongs, getSetlists } from '@/lib/db';
import { useAuth } from '@/context/AuthContext';

interface OfflineReadinessStatus {
  isReady: boolean;
  cachedSongs: number;
  cachedSetlists: number;
  totalItems: number;
  readinessPercentage: number;
  features: {
    name: string;
    available: boolean;
    description: string;
  }[];
}

export function OfflineReadinessChecker() {
  const { user } = useAuth();
  const isOnline = useOnlineStatus();
  const [status, setStatus] = useState<OfflineReadinessStatus | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkOfflineReadiness = async () => {
    if (!user) return;

    setIsChecking(true);
    try {
      // Get cached data counts
      const [songs, setlists] = await Promise.all([
        getAllSavedSongs(user.uid),
        getSetlists(user.uid),
      ]);

      const cachedSongs = songs.length;
      const cachedSetlists = setlists.length;
      const totalItems = cachedSongs + cachedSetlists;

      // Define offline features and their availability
      const features = [
        {
          name: 'Songs Playback',
          available: cachedSongs > 0,
          description: `${cachedSongs} songs cached locally`,
        },
        {
          name: 'Setlists Management',
          available: cachedSetlists > 0,
          description: `${cachedSetlists} setlists available offline`,
        },
        {
          name: 'Chord Transposition',
          available: true,
          description: 'Works fully offline',
        },
        {
          name: 'Auto-scroll',
          available: true,
          description: 'Works fully offline',
        },
        {
          name: 'Floating Controls',
          available: true,
          description: 'Position and visibility cached',
        },
        {
          name: 'Theme Settings',
          available: true,
          description: 'Preferences stored locally',
        },
        {
          name: 'PWA Installation',
          available: 'serviceWorker' in navigator,
          description: 'Service Worker supported',
        },
        {
          name: 'Data Sync',
          available: isOnline,
          description: isOnline
            ? 'Will sync when connected'
            : 'Will sync when online',
        },
      ];

      const availableFeatures = features.filter((f) => f.available).length;
      const readinessPercentage = Math.round(
        (availableFeatures / features.length) * 100
      );
      const isReady = totalItems > 0 && availableFeatures >= 6; // At least 6/8 features

      setStatus({
        isReady,
        cachedSongs,
        cachedSetlists,
        totalItems,
        readinessPercentage,
        features,
      });
    } catch (error) {
      console.error('Failed to check offline readiness:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (user) {
      checkOfflineReadiness();
    }
  }, [user, isOnline]);

  if (!user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <WifiOff className='w-5 h-5' />
            Offline Readiness
          </CardTitle>
          <CardDescription>
            Please log in to check offline capabilities
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (!status) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='flex items-center gap-2'>
            <div className='w-5 h-5 animate-spin rounded-full border-2 border-current border-t-transparent' />
            Checking Offline Readiness...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          {status.isReady ? (
            <CheckCircle className='w-5 h-5 text-green-500' />
          ) : (
            <AlertCircle className='w-5 h-5 text-yellow-500' />
          )}
          Offline Readiness
          <Badge variant={status.isReady ? 'default' : 'secondary'}>
            {status.readinessPercentage}%
          </Badge>
        </CardTitle>
        <CardDescription>
          {status.isReady
            ? 'Your app is ready for offline use!'
            : 'Some features may be limited offline'}
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        {/* Overall Progress */}
        <div className='space-y-2'>
          <div className='flex justify-between text-sm'>
            <span>Overall Readiness</span>
            <span>{status.readinessPercentage}%</span>
          </div>
          <Progress value={status.readinessPercentage} className='h-2' />
        </div>

        {/* Connection Status */}
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-2'>
            {isOnline ? (
              <Wifi className='w-4 h-4 text-green-500' />
            ) : (
              <WifiOff className='w-4 h-4 text-red-500' />
            )}
            <span className='text-sm font-medium'>Connection</span>
          </div>
          <Badge variant={isOnline ? 'default' : 'destructive'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {/* Cached Data */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='flex items-center gap-2 p-3 bg-muted/50 rounded-lg'>
            <HardDrive className='w-4 h-4 text-blue-500' />
            <div className='text-sm'>
              <div className='font-medium'>{status.cachedSongs}</div>
              <div className='text-muted-foreground'>Songs</div>
            </div>
          </div>
          <div className='flex items-center gap-2 p-3 bg-muted/50 rounded-lg'>
            <HardDrive className='w-4 h-4 text-green-500' />
            <div className='text-sm'>
              <div className='font-medium'>{status.cachedSetlists}</div>
              <div className='text-muted-foreground'>Setlists</div>
            </div>
          </div>
        </div>

        {/* Feature Availability */}
        <div className='space-y-3'>
          <h4 className='text-sm font-medium'>Feature Availability</h4>
          <div className='space-y-2'>
            {status.features.map((feature, index) => (
              <div
                key={index}
                className='flex items-center justify-between text-sm'
              >
                <div className='flex items-center gap-2'>
                  {feature.available ? (
                    <CheckCircle className='w-3 h-3 text-green-500' />
                  ) : (
                    <AlertCircle className='w-3 h-3 text-yellow-500' />
                  )}
                  <span
                    className={
                      feature.available
                        ? 'text-foreground'
                        : 'text-muted-foreground'
                    }
                  >
                    {feature.name}
                  </span>
                </div>
                <span className='text-xs text-muted-foreground'>
                  {feature.description}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Refresh Button */}
        <Button
          variant='outline'
          size='sm'
          onClick={checkOfflineReadiness}
          disabled={isChecking}
          className='w-full'
        >
          {isChecking ? (
            <>
              <div className='w-3 h-3 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent' />
              Checking...
            </>
          ) : (
            'Refresh Check'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

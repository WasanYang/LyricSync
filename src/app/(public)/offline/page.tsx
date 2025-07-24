'use client';

import { useState } from 'react';
import { useOfflineStorage } from '@/hooks/use-offline-storage';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { OfflineStatus } from '@/components/OfflineCache';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';

export default function OfflineSettingsPage() {
  const { hasOfflineData, cachedSongsCount, cachedSetlistsCount, isOnline } =
    useOfflineStorage();

  const [autoCache, setAutoCache] = useState(false);
  const [cacheQuality, setCacheQuality] = useState('high');

  const estimatedStorage = cachedSongsCount * 50 + cachedSetlistsCount * 20; // KB estimate

  const clearCache = () => {
    // Implementation for clearing offline cache
    console.log('Clearing offline cache...');
  };

  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
        <div className='max-w-2xl mx-auto space-y-6'>
          <div>
            <h1 className='text-3xl font-bold font-headline mb-2'>
              Offline Settings
            </h1>
            <p className='text-muted-foreground'>
              Manage your offline content and sync preferences
            </p>
          </div>

          <OfflineStatus className='p-4 bg-muted/50 rounded-lg' />

          <Card>
            <CardHeader>
              <CardTitle>Storage Usage</CardTitle>
              <CardDescription>
                See how much space your offline content is using
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex justify-between text-sm'>
                  <span>Cached Songs</span>
                  <span>{cachedSongsCount} songs</span>
                </div>
                <div className='flex justify-between text-sm'>
                  <span>Cached Setlists</span>
                  <span>{cachedSetlistsCount} setlists</span>
                </div>
                <div className='flex justify-between text-sm font-medium'>
                  <span>Estimated Storage</span>
                  <span>{(estimatedStorage / 1024).toFixed(1)} MB</span>
                </div>
              </div>

              <Progress
                value={(estimatedStorage / 10240) * 100}
                className='h-2'
              />

              <Button
                variant='outline'
                onClick={clearCache}
                className='w-full'
                disabled={!hasOfflineData}
              >
                Clear All Offline Data
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Auto-Cache Settings</CardTitle>
              <CardDescription>
                Automatically download content for offline use
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div className='space-y-0.5'>
                  <Label htmlFor='auto-cache'>Auto-cache new songs</Label>
                  <p className='text-sm text-muted-foreground'>
                    Automatically download songs you view for offline access
                  </p>
                </div>
                <Switch
                  id='auto-cache'
                  checked={autoCache}
                  onCheckedChange={setAutoCache}
                />
              </div>

              <div className='space-y-2'>
                <Label>Cache Quality</Label>
                <div className='flex gap-2'>
                  <Button
                    variant={cacheQuality === 'low' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setCacheQuality('low')}
                  >
                    Low
                  </Button>
                  <Button
                    variant={cacheQuality === 'medium' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setCacheQuality('medium')}
                  >
                    Medium
                  </Button>
                  <Button
                    variant={cacheQuality === 'high' ? 'default' : 'outline'}
                    size='sm'
                    onClick={() => setCacheQuality('high')}
                  >
                    High
                  </Button>
                </div>
                <p className='text-xs text-muted-foreground'>
                  Higher quality uses more storage space
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Offline Features</CardTitle>
              <CardDescription>
                What's available when you're offline
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className='space-y-3'>
                <div className='flex items-center gap-3'>
                  <div className='h-2 w-2 rounded-full bg-green-500' />
                  <span className='text-sm'>
                    View cached songs and setlists
                  </span>
                </div>
                <div className='flex items-center gap-3'>
                  <div className='h-2 w-2 rounded-full bg-green-500' />
                  <span className='text-sm'>Play lyrics with auto-scroll</span>
                </div>
                <div className='flex items-center gap-3'>
                  <div className='h-2 w-2 rounded-full bg-green-500' />
                  <span className='text-sm'>
                    Transpose keys and adjust settings
                  </span>
                </div>
                <div className='flex items-center gap-3'>
                  <div className='h-2 w-2 rounded-full bg-amber-500' />
                  <span className='text-sm'>
                    Sync changes (requires internet)
                  </span>
                </div>
                <div className='flex items-center gap-3'>
                  <div className='h-2 w-2 rounded-full bg-amber-500' />
                  <span className='text-sm'>
                    Download new content (requires internet)
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

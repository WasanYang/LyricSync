// src/app/[locale]/(public)/songs/new/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { Song } from '@/lib/songs';
import { getAllCloudSongs } from '@/lib/db';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';
import SongListItem from '@/app/[locale]/(public)/search/component/SongListItem';
import { toMillisSafe } from '@/lib/db';

function LoadingSkeleton() {
  return (
    <div className='space-y-2'>
      <Skeleton className='h-14 w-full' />
      <Skeleton className='h-14 w-full' />
      <Skeleton className='h-14 w-full' />
      <Skeleton className='h-14 w-full' />
      <Skeleton className='h-14 w-full' />
      <Skeleton className='h-14 w-full' />
    </div>
  );
}

export default function NewReleasesPage() {
  const t = useTranslations('home');
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchSongs = async () => {
      setIsLoading(true);
      try {
        const allSongs = await getAllCloudSongs();
        const systemSongs = allSongs.filter((s) => s.source === 'system');
        setSongs(systemSongs);
      } catch (error) {
        console.error('Failed to fetch new releases:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSongs();
  }, []);

  const sortedSongs = useMemo(
    () =>
      [...songs].sort(
        (a, b) =>
          (toMillisSafe(b.updatedAt) || 0) - (toMillisSafe(a.updatedAt) || 0)
      ),
    [songs]
  );

  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
        <div className='space-y-8'>
          <h1 className='text-3xl font-bold font-headline'>
            {t('newReleases')}
          </h1>
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2'>
              {sortedSongs.map((song) => (
                <SongListItem key={song.id} song={song} />
              ))}
            </div>
          )}
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

'use client';

import type { Song } from '@/lib/songs';
import { notFound } from 'next/navigation';
import LyricPlayer from '@/components/LyricPlayer';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetCloudSongByIdQuery } from '@/store/songApi';

function LoadingSkeleton() {
  return (
    <div className='flex h-screen flex-col overflow-hidden bg-background'>
      <div className='pointer-events-auto fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm'>
        <div className='relative mx-auto flex h-14 items-center justify-between container'>
          <Skeleton className='h-9 w-9' />
          <Skeleton className='h-6 w-48' />
          <div className='w-9'></div>
        </div>
      </div>
      <div className='flex-grow p-4 pt-20'>
        <div className='mx-auto w-full max-w-lg space-y-4'>
          <div className='space-y-6 pt-12'>
            <Skeleton className='h-6 w-full' />
            <Skeleton className='h-6 w-5/6' />
            <Skeleton className='h-6 w-full' />
            <Skeleton className='h-6 w-3/4' />
            <Skeleton className='h-6 w-5/6' />
          </div>
        </div>
      </div>
      <div className='fixed bottom-0 left-0 right-0 bg-background/80 p-4'>
        <Skeleton className='mx-auto h-12 w-full max-w-lg rounded-lg' />
      </div>
    </div>
  );
}

type Props = { id: string };

export function SongPlayerComponent({ id }: Props) {
  const [song, setSong] = useState<Song | null>(null);
  const { data, isLoading, refetch, error } = useGetCloudSongByIdQuery(id);
  useEffect(() => {
    if (data) {
      setSong(data);
    }
  }, [data]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error) {
    notFound();
  }

  if (!song) {
    return null; // Should be handled by error state, but as a fallback
  }

  return (
    <div className='relative flex h-screen w-full flex-col bg-background'>
      <LyricPlayer song={song} />
    </div>
  );
}

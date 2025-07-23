
'use client';

import { getSong as getSongFromDb, getCloudSongById } from '@/lib/db';
import type { Song } from '@/lib/songs';
import { notFound, useParams } from 'next/navigation';
import LyricPlayer from '@/components/LyricPlayer';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/AuthContext';

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

export default function LyricPlayerPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [song, setSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // Still need auth context for conditional DB access

  useEffect(() => {
    async function fetchSong() {
      if (!id) return;
      try {
        setIsLoading(true);
        // Priority: Local DB (if logged in) > Cloud.
        let fetchedSong: Song | null | undefined = null;

        if (user) {
           fetchedSong = await getSongFromDb(id);
        }

        if (!fetchedSong) {
          fetchedSong = await getCloudSongById(id);
        }

        if (fetchedSong) {
          setSong(fetchedSong);
        } else {
          setError('Song not found.');
        }
      } catch (err) {
        console.error('Failed to load song', err);
        setError('Could not load the song.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSong();
  }, [id, user]);

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

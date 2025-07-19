// src/app/lyrics/[id]/page.tsx
'use client';

import { getSongById as getSongFromStatic, type Song } from '@/lib/songs';
import { getSong as getSongFromDb } from '@/lib/db';
import { notFound } from 'next/navigation';
import LyricPlayer from '@/components/LyricPlayer';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

interface LyricPageProps {
  params: {
    id: string;
  };
}

function LoadingSkeleton() {
    return (
        <div className="flex flex-col bg-background h-screen overflow-hidden p-4 pt-20">
            <div className="space-y-4 max-w-lg mx-auto w-full">
                <Skeleton className="h-8 w-3/4 mx-auto" />
                <Skeleton className="h-4 w-1/2 mx-auto" />
                <div className="pt-12 space-y-6">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-5/6" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-5/6" />
                </div>
            </div>
        </div>
    )
}

export default function LyricPage({ params }: LyricPageProps) {
  const { id } = params;
  const [song, setSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSong() {
      try {
        setIsLoading(true);
        // Try to get song from IndexedDB first for offline access
        let fetchedSong = await getSongFromDb(id);
        
        // If not in DB, get it from the static list
        if (!fetchedSong) {
          fetchedSong = getSongFromStatic(id);
        }

        if (fetchedSong) {
          setSong(fetchedSong);
        } else {
           setError('Song not found.');
        }
      } catch (err) {
        console.error("Failed to load song", err);
        setError('Could not load the song.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchSong();
  }, [id]);

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
    <div className="relative w-full min-h-screen bg-background">
      <LyricPlayer song={song} />
    </div>
  );
}

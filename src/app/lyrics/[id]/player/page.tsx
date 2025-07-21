
'use client';

import { getSongById as getSongFromStatic, type Song } from '@/lib/songs';
import { getSong as getSongFromDb, getCloudSongById } from '@/lib/db';
import { notFound, useParams } from 'next/navigation';
import LyricPlayer from '@/components/LyricPlayer';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

function LoadingSkeleton() {
    return (
        <div className="flex flex-col bg-background h-screen overflow-hidden">
            <div className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm pointer-events-auto">
              <div className="relative container mx-auto flex items-center justify-between h-14">
                <Skeleton className="h-9 w-9" />
                <Skeleton className="h-6 w-48" />
                <div className="w-9"></div>
              </div>
            </div>
            <div className="flex-grow p-4 pt-20">
                <div className="space-y-4 max-w-lg mx-auto w-full">
                    <div className="pt-12 space-y-6">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-5/6" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-6 w-5/6" />
                    </div>
                </div>
            </div>
             <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80">
                 <Skeleton className="h-12 w-full max-w-lg mx-auto rounded-lg" />
            </div>
        </div>
    )
}

export default function LyricPlayerPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [song, setSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSong() {
      if (!id) return;
      try {
        setIsLoading(true);
        // Priority: Local DB > Static List > Cloud
        let fetchedSong = await getSongFromDb(id);
        
        if (!fetchedSong) {
          fetchedSong = getSongFromStatic(id);
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
    <div className="relative w-full h-screen flex flex-col bg-background">
      <LyricPlayer song={song} />
    </div>
  );
}

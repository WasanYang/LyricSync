
'use client';

import { getSongById as getSongFromStatic, type Song, type LyricLine } from '@/lib/songs';
import { getSong as getSongFromDb, getCloudSongById } from '@/lib/db';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import SongStatusButton from '@/components/SongStatusButton';
import { Play, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';

function LoadingSkeleton() {
    return (
        <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                <Skeleton className="w-48 h-48 sm:w-64 sm:h-64 rounded-lg flex-shrink-0" />
                <div className="space-y-4 flex-grow w-full text-center sm:text-left">
                    <Skeleton className="h-10 w-3/4 mx-auto sm:mx-0" />
                    <Skeleton className="h-6 w-1/2 mx-auto sm:mx-0" />
                    <div className="flex gap-4 justify-center sm:justify-start pt-4">
                        <Skeleton className="h-11 w-40" />
                        <Skeleton className="h-11 w-11 rounded-full" />
                    </div>
                </div>
            </div>
            <div className="space-y-4">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-40 w-full" />
            </div>
        </div>
    )
}

const parseLyrics = (line: string) => {
    return line.replace(/\[[^\]]+\]/g, ' ').replace(/\s+/g, ' ').trim();
};

const getLyricPreview = (lyrics: LyricLine[]) => {
    let preview = '';
    let lineCount = 0;
    for (const line of lyrics) {
        if (line.text.startsWith('(')) continue; // Skip section headers
        const textOnly = parseLyrics(line.text);
        if (textOnly) {
            preview += textOnly + (lineCount < 3 ? '\n' : '...');
            lineCount++;
            if (lineCount >= 4) break;
        }
    }
    return preview;
}

function SongDetailContent() {
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

  const lyricPreview = useMemo(() => {
    return song ? getLyricPreview(song.lyrics) : '';
  }, [song]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }
  
  if (error || !song) {
     notFound();
  }

  return (
    <div className="space-y-8 pt-8">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
            <div className="flex-shrink-0">
                <Image
                    src={`https://placehold.co/300x300.png`}
                    alt={`${song.title} album art`}
                    width={200}
                    height={200}
                    className="rounded-lg shadow-lg"
                    data-ai-hint="album cover"
                />
            </div>
            <div className="flex-grow space-y-3 text-center sm:text-left">
                <h1 className="text-4xl font-bold font-headline">{song.title}</h1>
                <p className="text-xl text-muted-foreground">{song.artist}</p>
                <div className="text-sm text-muted-foreground space-x-4">
                    {song.originalKey && <span>Key: {song.originalKey}</span>}
                    {song.bpm && <span>BPM: {song.bpm}</span>}
                    {song.timeSignature && <span>Time: {song.timeSignature}</span>}
                </div>
                <div className="flex items-center gap-3 pt-4 justify-center sm:justify-start">
                    <Button asChild size="lg">
                        <Link href={`/lyrics/${song.id}/player`}>
                            <Play className="mr-2 h-5 w-5" /> Start Session
                        </Link>
                    </Button>
                    <SongStatusButton song={song} />
                </div>
            </div>
        </div>
        <div className="space-y-4">
            <h2 className="text-2xl font-bold font-headline">Lyrics</h2>
            <div className="p-4 bg-muted/50 rounded-lg whitespace-pre-wrap font-body text-muted-foreground">
                {lyricPreview}
            </div>
        </div>
    </div>
  );
}


export default function SongDetailPage() {
    const router = useRouter();

    return (
        <div className="flex-grow flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8 relative">
                 <Button variant="ghost" size="icon" className="absolute top-4 left-4" onClick={() => router.back()}>
                    <ArrowLeft className="h-5 w-5" />
                    <span className="sr-only">Back</span>
                </Button>
                <SongDetailContent />
            </main>
            <BottomNavBar />
        </div>
    )
}

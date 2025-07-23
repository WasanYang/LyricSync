
'use client';

import { getSong as getSongFromDb, getCloudSongById } from '@/lib/db';
import type { LyricLine, Song } from '@/lib/songs';
import { notFound, useParams, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import SongStatusButton from '@/components/SongStatusButton';
import { ArrowLeft, Play, Share2 } from 'lucide-react';
import Link from 'next/link';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { useAuth } from '@/context/AuthContext';

function LoadingSkeleton() {
  return (
    <div className='space-y-8'>
      <div className='flex flex-col items-center gap-8 sm:flex-row sm:items-start'>
        <Skeleton className='h-48 w-48 flex-shrink-0 rounded-lg sm:h-64 sm:w-64' />
        <div className='w-full flex-grow space-y-4 text-center sm:text-left'>
          <Skeleton className='mx-auto h-10 w-3/4 sm:mx-0' />
          <Skeleton className='mx-auto h-6 w-1/2 sm:mx-0' />
          <div className='flex justify-center gap-4 pt-4 sm:justify-start'>
            <Skeleton className='h-11 w-40' />
            <Skeleton className='h-11 w-11 rounded-full' />
          </div>
        </div>
      </div>
      <div className='space-y-4'>
        <Skeleton className='h-6 w-32' />
        <Skeleton className='h-40 w-full' />
      </div>
    </div>
  );
}

const parseLyrics = (line: string) => {
  return line
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
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
};

function SongDetailContent() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const [song, setSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth(); // Still need auth context for conditional UI

  useEffect(() => {
    async function fetchSong() {
      if (!id) return;
      try {
        setIsLoading(true);
        // Priority: Local DB > Cloud.
        // Local DB access requires user interaction/login in some cases, but checking it first is fine.
        let fetchedSong: Song | null | undefined = null;

        if (user) {
          // Only check local DB if user is logged in
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
    <div className='space-y-8 pt-8'>
      <div className='flex flex-col items-center gap-8 sm:flex-row sm:items-start'>
        <div className='flex-shrink-0'>
          <Image
            src={`https://placehold.co/300x300.png?text=${encodeURIComponent(
              song.title
            )}`}
            alt={`${song.title} album art`}
            width={200}
            height={200}
            className='rounded-lg shadow-lg'
            data-ai-hint='album cover'
          />
        </div>
        <div className='flex-grow space-y-3 text-center sm:text-left'>
          <h1 className='font-headline text-4xl font-bold'>{song.title}</h1>
          <p className='text-xl text-muted-foreground'>{song.artist}</p>
          <div className='space-x-4 text-sm text-muted-foreground'>
            {song.originalKey && <span>Key: {song.originalKey}</span>}
            {song.bpm && <span>BPM: {song.bpm}</span>}
            {song.timeSignature && <span>Time: {song.timeSignature}</span>}
          </div>
          <div className='flex items-center justify-center gap-3 pt-4 sm:justify-start'>
            <Button asChild size='lg'>
              <Link href={`/lyrics/${song.id}/player`}>
                <Play className='mr-2 h-5 w-5' /> Start Session
              </Link>
            </Button>
            {user && <SongStatusButton song={song} />}
            {song.source === 'system' && (
              <Button asChild variant='outline' size='icon'>
                <Link href={`/songs/share/${song.id}`}>
                  <Share2 className='h-4 w-4' />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
      <div className='space-y-4'>
        <h2 className='font-headline text-2xl font-bold'>Lyrics</h2>
        <div className='whitespace-pre-wrap rounded-lg bg-muted/50 p-4 font-body text-muted-foreground'>
          {lyricPreview}
        </div>
      </div>
    </div>
  );
}

export default function SongDetailPage() {
  const router = useRouter();
  const { user } = useAuth(); // Use auth to conditionally render Header/Navbar

  return (
    <div className='flex-grow flex flex-col'>
      {user && <Header />}
      <main className='container relative mx-auto flex-grow px-4 py-8 pb-24 md:pb-8'>
        {user && (
            <Button
            variant='ghost'
            size='icon'
            className='absolute top-4 left-4'
            onClick={() => router.back()}
            >
                <ArrowLeft className='h-5 w-5' />
                <span className='sr-only'>Back</span>
            </Button>
        )}
        <SongDetailContent />
      </main>
      {user && <BottomNavBar />}
    </div>
  );
}

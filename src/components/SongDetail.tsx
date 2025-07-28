// src/components/SongDetail.tsx
'use client';

import type { LyricLine, Song } from '@/lib/songs';
import { useEffect, useMemo, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import AlbumArt from './ui/AlbumArt';
import Header from './Header';
import BottomNavBar from './BottomNavBar';
import { Button } from '@/components/ui/button';
import SongStatusButton from '@/components/SongStatusButton';
import {
  Play,
  Music,
  Share2,
  ChevronDown,
  ChevronUp,
  Check,
} from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useSafeDataLoader } from '@/hooks/use-offline-storage';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';

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
    .replace(/\[[^\]]+\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

const getLyricPreview = (lyrics: LyricLine[], isExpanded: boolean) => {
  let content = '';
  let lineCount = 0;
  const maxLines = isExpanded ? lyrics.length : 4;

  for (const line of lyrics) {
    if (line.text.startsWith('(')) {
      content += `${line.text}\n`;
      continue;
    }
    const textOnly = parseLyrics(line.text);
    if (textOnly) {
      content += textOnly + '\n';
      lineCount++;
      if (lineCount >= maxLines) {
        if (!isExpanded) content += '...';
        break;
      }
    }
  }
  return content.trim();
};

export interface SongDetailProps {
  songId: string;
  showPlayerLink?: boolean;
  isSharePage?: boolean;
}

export function SongDetail({
  songId,
  showPlayerLink = true,
  isSharePage = false,
}: SongDetailProps) {
  const { user } = useAuth();
  const [song, setSong] = useState<Song | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isLyricsExpanded, setIsLyricsExpanded] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const { loadSong, isOnline } = useSafeDataLoader();
  const { toast } = useToast();
  const url = isSharePage
    ? `/shared/song/${songId}/player`
    : `/lyrics/${songId}/player`;
  useEffect(() => {
    async function fetchSong() {
      if (!songId) return;
      try {
        setIsLoading(true);
        setError(null);
        const fetchedSong = await loadSong(songId);
        if (fetchedSong) {
          setSong(fetchedSong);
        } else {
          setError(
            isOnline
              ? 'Song not found.'
              : 'Song not available offline. Please connect to the internet to download it.'
          );
        }
      } catch (err) {
        console.error('Failed to load song', err);
        setError(
          isOnline ? 'Could not load the song.' : 'Song not available offline.'
        );
      } finally {
        setIsLoading(false);
      }
    }
    fetchSong();
  }, [songId, loadSong, isOnline]);

  const handleShare = () => {
    if (!song) return;
    const shareUrl = `${window.location.origin}/shared/song/${song.id}`;
    navigator.clipboard.writeText(shareUrl).then(
      () => {
        setIsCopied(true);
        toast({
          title: 'Link Copied!',
          description: 'A shareable link has been copied to your clipboard.',
        });
        setTimeout(() => setIsCopied(false), 2000);
      },
      () => {
        toast({
          title: 'Error',
          description: 'Could not copy the link.',
          variant: 'destructive',
        });
      }
    );
  };

  const lyricContent = useMemo(() => {
    return song ? getLyricPreview(song.lyrics, isLyricsExpanded) : '';
  }, [song, isLyricsExpanded]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (error || !song) {
    return (
      <div className='container mx-auto px-4 py-8 pb-24 md:pb-8'>
        <div className='max-w-2xl mx-auto text-center space-y-4'>
          {!isOnline && (
            <Alert className='border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200'>
              <Music className='h-4 w-4' />
              <AlertDescription>
                You're currently offline. This song may not be available
                without an internet connection.
              </AlertDescription>
            </Alert>
          )}
          <div className='text-muted-foreground'>
            <Music className='w-16 h-16 mx-auto mb-4' />
            <p className='text-lg'>{error || 'Song not found'}</p>
            <Button asChild className='mt-4'>
              <Link href='/library'>Back to Library</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='container relative mx-auto flex-grow px-4 py-8 pb-24 md:pb-8'>
        <div className='flex flex-col items-center gap-8 sm:flex-row sm:items-start'>
          <div className='flex-shrink-0'>
            <AlbumArt
              title={song.title}
              width={200}
              height={200}
              className='rounded-lg shadow-lg'
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
            <TooltipProvider>
              <div className='flex items-center justify-center gap-3 pt-4 sm:justify-start'>
                {showPlayerLink && (
                  <Button asChild size='lg'>
                    <Link href={url}>
                      <Play className='mr-2 h-5 w-5' /> Open in Player
                    </Link>
                  </Button>
                )}
                {user && <SongStatusButton song={song} />}
                {song.source === 'system' && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='outline'
                        size='icon'
                        onClick={handleShare}
                      >
                        {isCopied ? (
                          <Check className='h-4 w-4 text-green-500' />
                        ) : (
                          <Share2 className='h-4 w-4' />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Share Song</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </TooltipProvider>
          </div>
        </div>
        <div className='space-y-2 pt-4'>
          <h2 className='font-headline text-2xl font-bold'>Lyrics</h2>
          <div className='whitespace-pre-wrap rounded-lg bg-muted/50 p-4 font-body text-muted-foreground'>
            {lyricContent}
          </div>
          <div className='flex justify-center'>
            <Button
              variant='link'
              onClick={() => setIsLyricsExpanded(!isLyricsExpanded)}
            >
              {isLyricsExpanded ? (
                <ChevronUp className='mr-2 h-4 w-4' />
              ) : (
                <ChevronDown className='mr-2 h-4 w-4' />
              )}
              {isLyricsExpanded ? 'Show Less' : 'View More'}
            </Button>
          </div>
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

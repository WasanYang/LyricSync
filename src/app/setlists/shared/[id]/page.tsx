// src/app/setlists/shared/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  useParams,
  notFound,
  useRouter,
  useSearchParams,
} from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import type { Setlist, saveSetlist as saveSetlistType } from '@/lib/db';
import type { Song } from '@/lib/songs';
import {
  getSetlistByFirestoreId,
  getSong as getSongFromLocalDb,
  getCloudSongById,
  saveSetlist,
} from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Library, ArrowLeft, Download, Check, Play } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';

function LoadingSkeleton() {
  return (
    <div className='space-y-8'>
      <div className='space-y-3 pt-8 text-center'>
        <Skeleton className='h-10 w-3/4 mx-auto' />
        <Skeleton className='h-5 w-24 mx-auto' />
      </div>
      <div className='flex justify-center gap-4'>
        <Skeleton className='h-11 w-48' />
      </div>
      <div className='space-y-2'>
        <Skeleton className='h-14 w-full' />
        <Skeleton className='h-14 w-full' />
        <Skeleton className='h-14 w-full' />
      </div>
    </div>
  );
}

function SongItem({ song }: { song: Song }) {
  return (
    <div className='flex items-center space-x-4 p-3 rounded-lg bg-muted/50'>
      <Image
        src={`https://placehold.co/80x80.png?text=${encodeURIComponent(
          song.title
        )}`}
        alt={`${song.title} album art`}
        width={48}
        height={48}
        className='rounded-md aspect-square object-cover'
        data-ai-hint='album cover'
      />
      <div className='flex-grow min-w-0'>
        <p className='font-semibold font-headline truncate'>{song.title}</p>
        <p className='text-sm text-muted-foreground truncate'>{song.artist}</p>
      </div>
    </div>
  );
}

function SharedSetlistContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const isAdminMode = searchParams.get('mode') === 'admin';

  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const findSong = async (songId: string): Promise<Song | null> => {
    let song = await getSongFromLocalDb(songId);
    if (song) return song;

    song = await getCloudSongById(songId);
    return song;
  };

  useEffect(() => {
    async function loadSetlist() {
      if (!id) return;
      try {
        setIsLoading(true);
        const loadedSetlist = await getSetlistByFirestoreId(id);
        if (loadedSetlist) {
          setSetlist(loadedSetlist);
          const songPromises = loadedSetlist.songIds.map(findSong);
          const loadedSongs = (await Promise.all(songPromises)).filter(
            Boolean
          ) as Song[];
          setSongs(loadedSongs);
        } else {
          notFound();
        }
      } catch (err) {
        console.error('Failed to load shared setlist', err);
        notFound();
      } finally {
        setIsLoading(false);
      }
    }
    loadSetlist();
  }, [id]);

  const handleSaveToLibrary = async () => {
    if (!user || !setlist) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to save a setlist.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      // Create a new local copy
      const newLocalSetlist: Setlist = {
        ...setlist,
        id: `local-${uuidv4()}`, // Generate a new local-only ID
        userId: user.uid,
        firestoreId: null, // This is a local copy, not synced under this user
        isSynced: false,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await saveSetlist(newLocalSetlist);

      toast({
        title: 'Setlist Saved!',
        description: `"${setlist.title}" has been added to your library.`,
      });
      setIsSaved(true);
    } catch (error) {
      console.error('Failed to save setlist:', error);
      toast({
        title: 'Error',
        description: 'Could not save the setlist to your library.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!setlist) {
    return notFound();
  }

  const isOwner = user && setlist.userId === user.uid;

  const renderActionButtons = () => {
    if (isAdminMode) {
      return null; // No buttons in admin mode
    }
    if (!user) {
      return (
        <Button asChild size='lg'>
          <Link href={`/setlists/shared/${id}/player`}>
            <Play className='mr-2 h-5 w-5' /> View in Player
          </Link>
        </Button>
      );
    }
    if (isOwner) {
      return (
        <Button asChild size='lg'>
          <Link href={`/setlists/${setlist.id}/player`}>
            <Play className='mr-2 h-5 w-5' /> View in Player
          </Link>
        </Button>
      );
    }
    // Logged in, but not the owner
    return (
      <Button
        onClick={handleSaveToLibrary}
        size='lg'
        disabled={isSaving || isSaved}
      >
        {isSaved ? (
          <Check className='mr-2 h-5 w-5' />
        ) : (
          <Download className='mr-2 h-5 w-5' />
        )}
        {isSaving
          ? 'Saving...'
          : isSaved
          ? 'Saved to Library'
          : 'Save to My Library'}
      </Button>
    );
  };

  return (
    <div className='space-y-8'>
      <div className='space-y-2 pt-8 text-center'>
        <h1 className='text-4xl font-bold font-headline'>{setlist.title}</h1>
        <p className='text-muted-foreground'>
          {songs.length} {songs.length === 1 ? 'song' : 'songs'}
        </p>
      </div>

      <div className='flex flex-wrap gap-2 justify-center'>
        {renderActionButtons()}
      </div>

      <div className='space-y-2'>
        {songs.map((song) => (
          <SongItem key={song.id} song={song} />
        ))}
        {songs.length === 0 && (
          <div className='text-center py-10 text-muted-foreground'>
            <p>This setlist is empty or the songs could not be loaded.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SharedSetlistPage() {
  const { user } = useAuth();
  const router = useRouter();
  return (
    <div className='flex-grow flex flex-col'>
      {user ? (
        <Header />
      ) : (
        <header className='sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
          <div className='flex h-16 items-center justify-between px-4 max-w-4xl mx-auto'>
            <Link href='/welcome' className='flex items-center space-x-2'>
              <Image
                src='/icons/logo.png'
                alt='LyricSync'
                width={24}
                height={24}
              />
              <span className='font-bold font-headline text-lg'>LyricSync</span>
            </Link>
          </div>
        </header>
      )}
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8 relative'>
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
        <SharedSetlistContent />
      </main>
      {user && <BottomNavBar />}
    </div>
  );
}

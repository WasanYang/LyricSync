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
import type { Setlist } from '@/lib/db';
import type { Song } from '@/lib/songs';
import {
  getSetlistByFirestoreId,
  getSong as getSongFromLocalDb,
  getCloudSongById,
  saveSetlist,
  getSetlists,
} from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Library, ArrowLeft, Check, Play, Users, Share2 } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';

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
  const [isCopied, setIsCopied] = useState(false);

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

        if (user && loadedSetlist) {
          // Correctly check if the setlist is already saved by the user
          const userSetlists = await getSetlists(user.uid);
          const alreadySaved = userSetlists.find(
            (sl) => sl.firestoreId === loadedSetlist.firestoreId
          );
          if (alreadySaved) {
            setIsSaved(true);
          }
        }

        if (loadedSetlist) {
          setSetlist(loadedSetlist);

          // If the logged-in user is the owner, redirect them to their own setlist page.
          if (user && loadedSetlist.userId === user.uid && !isAdminMode) {
            const userSetlists = await getSetlists(user.uid);
            const localSetlist = userSetlists.find(
              (sl) => sl.firestoreId === loadedSetlist.firestoreId
            );
            if (localSetlist) {
              router.replace(`/setlists/${localSetlist.id}`);
              return; // Stop further execution in this component
            }
          }

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
  }, [id, user, router, isAdminMode]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(
      () => {
        setIsCopied(true);
        toast({
          title: 'Link Copied!',
          description: 'A shareable link has been copied to your clipboard.',
        });
        setTimeout(() => setIsCopied(false), 2000);
      },
      (err) => {
        toast({
          title: 'Error',
          description: 'Could not copy the link.',
          variant: 'destructive',
        });
      }
    );
  };

  const handleSaveToLibrary = async () => {
    if (!user || user.isAnonymous) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to save a setlist.',
        variant: 'destructive',
      });
      return;
    }

    if (!setlist || !setlist.firestoreId) return;

    setIsSaving(true);
    try {
      // Create a reference, not a full copy
      const savedSetlistReference: Setlist = {
        id: uuidv4(), // Give it a new unique local ID
        title: setlist.title,
        songIds: setlist.songIds,
        userId: user.uid, // Belongs to the current user now
        createdAt: Date.now(),
        updatedAt: setlist.updatedAt,
        isSynced: false, // It's not an owned, synced setlist
        firestoreId: setlist.firestoreId,
        isPublic: setlist.isPublic,
        authorName: setlist.authorName,
        source: 'saved',
      };

      await saveSetlist(savedSetlistReference);

      toast({
        title: 'Setlist Saved!',
        description: `"${setlist.title}" has been saved to your setlists.`,
      });
      setIsSaved(true);
    } catch (error) {
      console.error('Failed to save setlist reference:', error);
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
    return (
      <div className='container mx-auto px-4 py-8 pb-24 md:pb-8 text-center'>
        <p>Setlist not found.</p>
      </div>
    );
  }

  const isOwner = user && setlist.userId === user.uid;
  const isAnonymous = !user || user.isAnonymous;

  const renderActionButtons = () => {
    if (isAdminMode) {
      return null; // No buttons in admin mode
    }
    if (isOwner) {
      // Should not happen often due to redirect, but as a fallback
      return (
        <Button asChild size='lg'>
          <Link href={`/setlists/${id}/player`}>
            <Play className='mr-2 h-5 w-5' /> View in Player
          </Link>
        </Button>
      );
    }
    // Not owner (guest or another user)
    return (
      <TooltipProvider>
        <div className='flex items-center gap-2'>
          <Button asChild size='lg'>
            <Link href={`/shared/setlists/${id}/player`}>
              <Play className='mr-2 h-5 w-5' /> View in Player
            </Link>
          </Button>
          {!isAnonymous && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size='icon'
                  variant='outline'
                  onClick={handleSaveToLibrary}
                  disabled={isSaving || isSaved}
                  aria-label='Save to My Setlists'
                >
                  {isSaved ? (
                    <Check className='h-5 w-5 text-green-500' />
                  ) : (
                    <Library className='h-5 w-5' />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isSaved ? 'Saved in your setlists' : 'Save to My Setlists'}
                </p>
              </TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size='icon'
                variant='outline'
                onClick={handleShare}
                aria-label='Share Setlist'
              >
                {isCopied ? (
                  <Check className='h-5 w-5 text-green-500' />
                ) : (
                  <Share2 className='h-5 w-5' />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Share Setlist</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </TooltipProvider>
    );
  };

  return (
    <div className='space-y-8'>
      <div className='space-y-2 pt-8 text-center'>
        <h1 className='text-4xl font-bold font-headline'>{setlist.title}</h1>
        <p className='text-muted-foreground'>
          {songs.length} {songs.length === 1 ? 'song' : 'songs'} • By{' '}
          {setlist.authorName}
        </p>
      </div>

      <div className='flex flex-wrap gap-2 justify-center'>
        {renderActionButtons()}
      </div>

      <div className='space-y-2'>
        {!isLoading &&
          songs.length > 0 &&
          songs.map((song) => <SongItem key={song.id} song={song} />)}
        {!isLoading && songs.length === 0 && (
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
                src='/logo/logo.png'
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
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push('/');
              }
            }}
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

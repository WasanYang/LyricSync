// src/app/[locale]/(guest)/setlists/[id]/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import type { Setlist } from '@/lib/db';
import type { Song } from '@/lib/songs';
import {
  getSetlist as getSetlistFromDb,
  getSong as getSongFromLocalDb,
  getCloudSongById,
} from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Play, ArrowLeft, Check, Share2, Library } from 'lucide-react';
import { SongItem } from '@/components/SetlistSharedComponents';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { useTranslations } from 'next-intl';

function LoadingSkeleton() {
  return (
    <div className='space-y-8'>
      <div className='space-y-3'>
        <Skeleton className='h-10 w-3/4' />
        <Skeleton className='h-5 w-24' />
      </div>
      <div className='flex gap-4'>
        <Skeleton className='h-11 w-40' />
        <Skeleton className='h-11 w-11' />
        <Skeleton className='h-11 w-11' />
      </div>
      <div className='space-y-2'>
        <Skeleton className='h-14 w-full' />
        <Skeleton className='h-14 w-full' />
        <Skeleton className='h-14 w-full' />
        <Skeleton className='h-14 w-full' />
      </div>
    </div>
  );
}

function SetlistDetailContent({
  onLoadingChange,
}: {
  onLoadingChange?: (loading: boolean) => void;
}) {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const t = useTranslations();

  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const findSong = async (songId: string): Promise<Song | undefined> => {
    const song: Song | undefined = await getSongFromLocalDb(songId);
    if (song) return song;

    const cloudSong = await getCloudSongById(songId);

    // Convert null to undefined for correct type
    return cloudSong === null ? undefined : cloudSong;
  };

  useEffect(() => {
    onLoadingChange?.(isLoading);
  }, [isLoading, onLoadingChange]);

  useEffect(() => {
    async function loadSetlist() {
      if (!id || !user) return;
      try {
        setIsLoading(true);
        const loadedSetlist = await getSetlistFromDb(id);
        if (loadedSetlist && loadedSetlist.userId === user.uid) {
          setSetlist(loadedSetlist);
          const songPromises = loadedSetlist.songIds.map(findSong);
          const loadedSongs = (await Promise.all(songPromises)).filter(
            Boolean
          ) as Song[];

          if (loadedSongs.length === loadedSetlist.songIds.length) {
            setSongs(loadedSongs);
          } else {
            toast({
              title: 'Error Loading Songs',
              description:
                'Some songs in this setlist could not be found and may have been deleted.',
              variant: 'destructive',
            });
            setSongs(loadedSongs);
          }
        } else {
          toast({
            title: 'Not Found',
            description: 'Setlist not found in your library.',
            variant: 'destructive',
          });
          notFound();
        }
      } catch (err) {
        console.error('Failed to load setlist', err);
        return notFound();
      } finally {
        setIsLoading(false);
      }
    }
    loadSetlist();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, user, router, toast]);

  if (isLoading) {
    return <LoadingSkeleton />;
  }

  if (!setlist) {
    return null; // Should be redirected, but as a fallback.
  }

  const isOwner = user && setlist.userId === user.uid;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(
      () => {
        setIsCopied(true);
        toast({
          title: t('setlist.linkCopiedToastTitle'),
          description: t('setlist.linkCopiedToastDesc'),
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

  const handleSaveToLibrary = async () => {
    if (!user || user.isAnonymous) {
      toast({
        title: 'Please log in',
        description: 'You need to be logged in to save a setlist.',
        variant: 'destructive',
      });
      return;
    }
    if (!setlist) return;
    setIsSaving(true);
    try {
      setIsSaved(true);
      toast({
        title: 'Setlist Saved!',
        description: `"${setlist.title}" has been saved to your setlists.`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Could not save the setlist to your library.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className='space-y-8'>
      <div className='space-y-2 pt-8 text-center'>
        <h1 className='text-4xl font-bold font-headline'>{setlist.title}</h1>
        <p className='text-muted-foreground'>
          {t('setlist.songCount', { count: songs.length })}
        </p>
      </div>
      <div className='flex flex-wrap gap-2 justify-center'>
        <Button asChild size='lg'>
          <Link href={`/setlists/${setlist.id}/player`}>
            <Play className='mr-2 h-5 w-5' /> {t('viewInPlayer')}
          </Link>
        </Button>
        {!isOwner && (
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
        )}
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
      </div>
      <div className='space-y-2'>
        {songs.map((song) => (
          <SongItem key={song.id} song={song} linkPrefix='/lyrics' />
        ))}
      </div>
    </div>
  );
}

export default function SetlistDetailPage() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('setlist');
  return (
    <div className='flex-grow flex flex-col'>
      {user && <Header />}
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
            <span className='sr-only'>{t('backButton')}</span>
          </Button>
        )}
        <SetlistDetailContent />
      </main>
      {user && <BottomNavBar />}
    </div>
  );
}

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
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Library, ArrowLeft, Check, Play, Share2 } from 'lucide-react';
import {
  SongItem,
  SetlistSkeleton,
} from '@/components/SetlistSharedComponents';
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
import { useTranslations } from 'next-intl';

function LoadingSkeleton() {
  return <SetlistSkeleton />;
}

// Removed duplicate SongItem

function SharedSetlistContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const isAdminMode = searchParams.get('mode') === 'admin';
  const t = useTranslations();

  const [setlist, setSetlist] = useState<Setlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const findSong = async (songId: string): Promise<Song | undefined> => {
    const song = await getSongFromLocalDb(songId);
    if (song) return song;
    const cloudSong = await getCloudSongById(songId);
    return cloudSong === null ? undefined : cloudSong;
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
        title: t('setlist.savedToLibraryToastTitle'),
        description: t('setlist.savedToLibraryToastDesc', {
          title: setlist.title,
        }),
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
            <Play className='mr-2 h-5 w-5' /> {t('viewInPlayer')}
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
              <Play className='mr-2 h-5 w-5' /> {t('viewInPlayer')}
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
                  aria-label={t('setlist.saveToMySetlistsAria')}
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
                  {isSaved
                    ? t('setlist.savedInYourSetlistsTooltip')
                    : t('setlist.saveToMySetlistsTooltip')}
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
                aria-label={t('setlist.shareTooltip')}
              >
                {isCopied ? (
                  <Check className='h-5 w-5 text-green-500' />
                ) : (
                  <Share2 className='h-5 w-5' />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{t('setlist.shareTooltip')}</p>
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
          {t('setlist.songCount', { count: songs.length })} •{' '}
          {t('setlist.byAuthor', { authorName: setlist.authorName })}
        </p>
      </div>

      <div className='flex flex-wrap gap-2 justify-center'>
        {renderActionButtons()}
      </div>

      <div className='space-y-2'>
        {!isLoading &&
          songs.length > 0 &&
          songs.map((song) => (
            <SongItem key={song.id} song={song} linkPrefix='/lyrics' />
          ))}
        {!isLoading && songs.length === 0 && (
          <div className='text-center py-10 text-muted-foreground'>
            <p>{t('setlist.emptySetlist')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SharedSetlistPage() {
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('setlist');

  return (
    <div className='flex-grow flex flex-col'>
      <Header />
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
        <SharedSetlistContent />
      </main>
      {user && <BottomNavBar />}
    </div>
  );
}

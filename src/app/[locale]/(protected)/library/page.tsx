'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAllSavedSongs,
  deleteSong as deleteSongFromDb,
  uploadSongToCloud,
} from '@/lib/db';
import type { Song } from '@/lib/songs';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import Image from 'next/image';
import Link from 'next/link';
import { Music, Trash2, Edit, PlusCircle, Play } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import SongStatusButton from '@/components/SongStatusButton';
import { Cloud } from 'lucide-react';

function SongListItem({
  song,
  onDelete,
  onUpdate,
}: {
  song: Song;
  onDelete: (songId: string, source: 'user' | 'system') => void;
  onUpdate: (songId: string) => void;
}) {
  const { user, isSuperAdmin } = useAuth();
  const { toast } = useToast();

  const isUserSong = song.source === 'user';

  const handleDelete = async () => {
    try {
      await deleteSongFromDb(
        song.id,
        song.source === 'user' ? user?.uid : undefined
      );
      onDelete(song.id, song.source);
      toast({
        title: `Song "${song.title}" deleted.`,
      });
    } catch {
      toast({
        title: 'Error',
        description: 'Could not delete the song.',
        variant: 'destructive',
      });
    }
  };

  const handlePromoteToSystem = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      // This function promotes a user song to a system song
      await uploadSongToCloud({ ...song, source: 'system' });
      toast({
        title: 'Song Promoted',
        description: `"${song.title}" has been promoted to a system song.`,
      });
      // Refresh the list to show the change in status/behavior
      onUpdate(song.id);
    } catch (error) {
      toast({
        title: 'Promotion Error',
        description:
          error instanceof Error ? error.message : 'Could not promote song.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className='flex items-center space-x-3 p-2 rounded-lg transition-colors hover:bg-muted group'>
      <div className='flex-grow flex items-center space-x-3 min-w-0'>
        <Link href={`/lyrics/${song.id}`}>
          <Image
            src={`https://placehold.co/80x80.png?text=${encodeURIComponent(
              song.title
            )}`}
            alt={`${song.title} album art`}
            width={40}
            height={40}
            className='rounded-md aspect-square object-cover'
            data-ai-hint='album cover'
          />
        </Link>
        <div className='min-w-0'>
          <div className='flex items-center gap-2'>
            <Link
              href={`/lyrics/${song.id}`}
              className='font-semibold font-headline truncate hover:underline'
            >
              {song.title}
            </Link>
            {song.source === 'user' && (
              <Music className='h-3 w-3 text-muted-foreground flex-shrink-0' />
            )}{' '}
            {song.source === 'system' && (
              <Cloud className='h-3 w-3 text-muted-foreground flex-shrink-0' />
            )}
          </div>
          <p className='text-sm text-muted-foreground truncate'>
            {song.artist}
          </p>
          {song.updatedAt && (
            <p className='text-xs text-muted-foreground/80 truncate'>
              Updated: {new Date(song.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      </div>
      <div className='flex-shrink-0 flex items-center'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                asChild
                variant='ghost'
                size='icon'
                className='h-8 w-8 text-muted-foreground'
              >
                <Link
                  href={`/lyrics/${song.id}/player`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Play className='h-4 w-4' />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View in Player</p>
            </TooltipContent>
          </Tooltip>

          {isUserSong && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 text-muted-foreground'
                  >
                    <Link
                      href={`/song-editor?id=${song.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Edit className='h-4 w-4' />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit</p>
                </TooltipContent>
              </Tooltip>
              {isSuperAdmin && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-muted-foreground'
                      onClick={handlePromoteToSystem}
                    >
                      <Music className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Promote to System Song</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          )}

          <Tooltip>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-muted-foreground hover:text-destructive'
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    &quot;
                    {song.title}&quot; from your library{' '}
                    {isUserSong ? 'and the cloud' : ''}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className='bg-destructive hover:bg-destructive/90'
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <TooltipContent>
              <p>Delete</p>
            </TooltipContent>
          </Tooltip>

          {song.source === 'system' && (
            <div
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
            >
              <SongStatusButton song={song} />
            </div>
          )}
        </TooltipProvider>
      </div>
    </div>
  );
}

export default function LibraryPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();

  const loadSongs = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    const loadedSongs = await getAllSavedSongs(user.uid);
    setSongs(loadedSongs);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      loadSongs();
    }
  }, [user, loadSongs]);

  const handleSongDeleted = (deletedId: string) => {
    setSongs((prevSongs) => prevSongs.filter((song) => song.id !== deletedId));
  };

  const handleSongUpdated = () => {
    // Re-fetch the songs to get the updated list
    loadSongs();
  };

  if (authLoading || !user) {
    return (
      <div className='flex-grow flex flex-col'>
        <Header />
        <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
          <div className='space-y-4'>
            <Skeleton className='h-8 w-48' />
            <div className='space-y-2'>
              <Skeleton className='h-12 w-full' />
              <Skeleton className='h-12 w-full' />
              <Skeleton className='h-12 w-full' />
            </div>
          </div>
        </main>
        <BottomNavBar />
      </div>
    );
  }

  const isAnonymous = user.isAnonymous;

  return (
    <>
      <div className='flex-grow flex flex-col'>
        <Header />
        <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
          <div className='space-y-8'>
            <div className='flex justify-between items-center'>
              <h1 className='text-3xl font-headline font-bold tracking-tight'>
                Library
              </h1>
              {!isAnonymous && (
                <Button variant='ghost' size='icon' asChild>
                  <Link href='/song-editor'>
                    <PlusCircle className='h-6 w-6' />
                    <span className='sr-only'>Add new song</span>
                  </Link>
                </Button>
              )}
            </div>

            {isLoading ? (
              <div className='space-y-2'>
                <Skeleton className='h-16 w-full' />
                <Skeleton className='h-16 w-full' />
                <Skeleton className='h-16 w-full' />
              </div>
            ) : songs.length > 0 ? (
              <div className='flex flex-col space-y-1'>
                {songs.map((song) => (
                  <SongListItem
                    key={song.id}
                    song={song}
                    onDelete={handleSongDeleted}
                    onUpdate={handleSongUpdated}
                  />
                ))}
              </div>
            ) : (
              <div className='text-center py-16 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full'>
                <Music className='h-12 w-12 text-muted-foreground mb-4' />
                <h2 className='text-xl font-headline font-semibold'>
                  Your Library is Empty
                </h2>
                <p className='text-muted-foreground'>
                  Create a song or find songs in Search to add to your library.
                </p>
                <Button variant='link' asChild>
                  <Link href='/search'>Find songs to add</Link>
                </Button>
              </div>
            )}
          </div>
        </main>
        <BottomNavBar />
      </div>
    </>
  );
}

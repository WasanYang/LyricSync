// src/app/[locale]/(protected)/library/page.tsx
'use client';

import { deleteSong as deleteSongFromDb, uploadSongToCloud } from '@/lib/db';
import type { Song } from '@/lib/songs';
import Image from 'next/image';
import Link from 'next/link';
import { Music, Trash2, Edit, Play, Download, Cloud } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import LocalsLink from '@/components/ui/LocalsLink';

export default function SongListItem({
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
    if (!user) return;
    try {
      await deleteSongFromDb(song.id, user.uid);
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

  const getDeleteDialogDescription = () => {
    if (isUserSong) {
      return `This action cannot be undone. This will permanently delete "${song.title}" from your library and the cloud.`;
    }
    return `This will remove "${song.title}" from your library. You can always add it back from the Search page.`;
  };

  return (
    <div className='flex items-center space-x-3 p-2 rounded-lg transition-colors hover:bg-muted group'>
      <div className='flex-grow flex items-center space-x-3 min-w-0'>
        <LocalsLink href={`/lyrics/${song.id}`}>
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
        </LocalsLink>
        <div className='min-w-0'>
          <div className='flex items-center gap-2'>
            <LocalsLink
              href={`/lyrics/${song.id}`}
              className='font-semibold font-headline truncate hover:underline'
            >
              {song.title}
            </LocalsLink>
            {song.source === 'user' ? (
              <Music className='h-3 w-3 text-muted-foreground flex-shrink-0' />
            ) : (
              <Cloud className='h-3 w-3 text-muted-foreground flex-shrink-0' />
            )}
          </div>
          <p className='text-sm text-muted-foreground truncate'>
            {song.artist}
          </p>
          <div className='flex items-center gap-2 text-xs text-muted-foreground/80 truncate'>
            {song.updatedAt && (
              <p>Updated: {new Date(song.updatedAt).toLocaleDateString()}</p>
            )}
            {typeof song.downloadCount === 'number' &&
              song.downloadCount > 0 && (
                <div className='flex items-center gap-1'>
                  <Download className='h-3 w-3' />
                  <span>{song.downloadCount}</span>
                </div>
              )}
          </div>
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
                <LocalsLink
                  href={`/lyrics/${song.id}/player`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <Play className='h-4 w-4' />
                </LocalsLink>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View in Player</p>
            </TooltipContent>
          </Tooltip>

          {isUserSong && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  asChild
                  variant='ghost'
                  size='icon'
                  className='h-8 w-8 text-muted-foreground'
                >
                  <LocalsLink
                    href={`/song-editor?id=${song.id}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Edit className='h-4 w-4' />
                  </LocalsLink>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit</p>
              </TooltipContent>
            </Tooltip>
          )}

          {isSuperAdmin && isUserSong && (
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
                    {getDeleteDialogDescription()}
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
        </TooltipProvider>
      </div>
    </div>
  );
}

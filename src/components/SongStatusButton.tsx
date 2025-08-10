// src/components/SongStatusButton.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Song } from '@/lib/songs';
import { saveSong, isSongSaved, deleteSong } from '@/lib/db';
import { Check, PlusCircle, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';
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

interface SongStatusButtonProps {
  song: Song;
  onStatusChange?: () => void; // Callback to notify parent of a change
}

export default function SongStatusButton({
  song,
  onStatusChange,
}: SongStatusButtonProps) {
  const { user } = useAuth();
  const [isSaved, setIsSaved] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { toast } = useToast();

  const checkSavedStatus = useCallback(async () => {
    if (!user || user.isAnonymous) {
      setIsChecking(false);
      return;
    }
    try {
      setIsChecking(true);
      const savedStatus = await isSongSaved(song.id);
      setIsSaved(savedStatus.saved);
    } catch (error) {
      console.error('Failed to check song status', error);
    } finally {
      setIsChecking(false);
    }
  }, [song.id, user]);

  useEffect(() => {
    checkSavedStatus();
  }, [checkSavedStatus]);

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;

    try {
      await saveSong({ ...song, userId: user.uid });
      setIsSaved(true);
      toast({
        title: 'Song Saved',
        description: `"${song.title}" has been added to your library.`,
      });
      onStatusChange?.(); // Notify parent
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not save the song.',
        variant: 'destructive',
      });
      console.error('Failed to save song:', error);
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) return;

    try {
      await deleteSong(song.id, user.uid);
      setIsSaved(false);
      toast({
        title: 'Song Removed',
        description: `"${song.title}" has been removed from your library.`,
      });
      onStatusChange?.(); // Notify parent
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not remove the song.',
        variant: 'destructive',
      });
      console.error('Failed to remove song:', error);
    }
  };

  if (!user || user.isAnonymous) {
    return null;
  }

  if (isChecking) {
    return <Skeleton className='h-7 w-7 rounded-full' />;
  }

  if (isSaved) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='h-7 w-7 text-green-500 hover:text-green-600'
            aria-label='Song is in your library'
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <Check className='h-5 w-5' />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove from Library?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{song.title}" from your personal library. You can
              add it back again later from the Search page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemove}
              className='bg-destructive hover:bg-destructive/90'
            >
              <Trash2 className='mr-2 h-4 w-4' /> Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={handleSave}
      className='h-7 w-7 text-muted-foreground hover:text-primary'
      aria-label='Save song to library'
    >
      <PlusCircle className='h-5 w-5' />
    </Button>
  );
}

// src/components/SongStatusButton.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { type Song } from '@/lib/songs';
import { saveSong, updateSong, isSongSaved, getCloudSongById } from '@/lib/db';
import { Download, Check, ArrowDownCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from './ui/skeleton';

interface SongStatusButtonProps {
  song: Song;
}

export default function SongStatusButton({ song }: SongStatusButtonProps) {
  const [status, setStatus] = useState<{ saved: boolean; needsUpdate: boolean }>({ saved: false, needsUpdate: false });
  const [isChecking, setIsChecking] = useState(true);
  const { toast } = useToast();

  const checkSavedStatus = useCallback(async () => {
    try {
      setIsChecking(true);
      const savedStatus = await isSongSaved(song.id);
      setStatus(savedStatus);
    } catch (error) {
      console.error("Failed to check song status", error);
    } finally {
      setIsChecking(false);
    }
  }, [song.id]);

  useEffect(() => {
    checkSavedStatus();
  }, [checkSavedStatus]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    try {
      await saveSong(song);
      setStatus({ saved: true, needsUpdate: false });
      toast({
        title: "Song Saved",
        description: `"${song.title}" is now available offline.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not save the song.",
        variant: "destructive",
      });
      console.error("Failed to save song:", error);
    }
  };

  const handleUpdate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const latestSong = await getCloudSongById(song.id);
      if (!latestSong) {
        throw new Error("Could not find the latest version of this song.");
      }
      await updateSong(latestSong);
      setStatus({ saved: true, needsUpdate: false });
      toast({
        title: "Song Updated",
        description: `"${song.title}" has been updated to the latest version.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Could not update the song.",
        variant: "destructive",
      });
      console.error("Failed to update song:", error);
    }
  };

  if (isChecking) {
    return <Skeleton className="h-7 w-7 rounded-full" />;
  }
  if (status.needsUpdate) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleUpdate}
        className="h-7 w-7 text-blue-500 hover:text-blue-600"
        aria-label="Update song"
      >
        <ArrowDownCircle className="h-5 w-5" />
      </Button>
    );
  }
  if (status.saved) {
    return (
      <Button
        variant="ghost"
        size="icon"
        disabled
        className="h-7 w-7 text-green-500 hover:text-green-500 cursor-not-allowed"
        aria-label="Song is saved offline"
      >
        <Check className="h-5 w-5" />
      </Button>
    );
  }
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleDownload}
      className="h-7 w-7 text-muted-foreground hover:text-primary"
      aria-label="Save song offline"
    >
      <Download className="h-5 w-5" />
    </Button>
  );
}

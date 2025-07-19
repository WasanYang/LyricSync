// src/components/SongCard.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { type Song } from '@/lib/songs';
import { saveSong, updateSong, isSongSaved } from '@/lib/db';
import { Download, Check, ArrowUpCircle } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Skeleton } from './ui/skeleton';

interface SongCardProps {
  song: Song;
}

export default function SongCard({ song }: SongCardProps) {
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
      await updateSong(song);
      setStatus({ saved: true, needsUpdate: false });
      toast({
        title: "Song Updated",
        description: `"${song.title}" has been updated to the latest version.`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update the song.",
        variant: "destructive",
      });
      console.error("Failed to update song:", error);
    }
  };

  const renderButton = () => {
    if (isChecking) {
      return <Skeleton className="h-8 w-8 rounded-full" />;
    }
    if (status.needsUpdate) {
      return (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleUpdate}
          className="h-8 w-8 text-blue-500 hover:text-blue-600"
          aria-label="Update song"
        >
          <ArrowUpCircle />
        </Button>
      );
    }
    if (status.saved) {
      return (
        <Button
          variant="ghost"
          size="icon"
          disabled
          className="h-8 w-8 text-green-500 hover:text-green-500 cursor-not-allowed"
          aria-label="Song is saved offline"
        >
          <Check />
        </Button>
      );
    }
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleDownload}
        className="h-8 w-8 text-muted-foreground hover:text-primary"
        aria-label="Save song offline"
      >
        <Download />
      </Button>
    );
  };

  return (
    <div className="group relative space-y-3">
       <Link href={`/lyrics/${song.id}`} className="block">
        <div className="aspect-square w-full overflow-hidden rounded-md transition-all duration-300 ease-in-out group-hover:shadow-lg">
          <Image
            src={`https://placehold.co/300x300.png?text=${encodeURIComponent(song.title)}`}
            alt={`${song.title} album art`}
            width={300}
            height={300}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="album cover"
          />
        </div>
      </Link>
      
      <div className="flex justify-between items-start gap-2">
        <Link href={`/lyrics/${song.id}`} className="block flex-grow min-w-0">
          <p className="font-semibold font-headline truncate">{song.title}</p>
          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
        </Link>
        {renderButton()}
      </div>
    </div>
  );
}

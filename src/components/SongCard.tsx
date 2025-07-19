// src/components/SongCard.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { type Song } from '@/lib/songs';
import { saveSong, isSongSaved } from '@/lib/db';
import { Download, Check } from 'lucide-react';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface SongCardProps {
  song: Song;
}

export default function SongCard({ song }: SongCardProps) {
  const [saved, setSaved] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function checkSavedStatus() {
      try {
        setIsChecking(true);
        const savedStatus = await isSongSaved(song.id);
        setSaved(savedStatus);
      } catch (error) {
        console.error("Failed to check song status", error);
      } finally {
        setIsChecking(false);
      }
    }
    checkSavedStatus();
  }, [song.id]);

  const handleDownload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (saved || isChecking) return;

    try {
      await saveSong(song);
      setSaved(true);
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
        <Button
          variant="ghost"
          size="icon"
          onClick={handleDownload}
          disabled={saved || isChecking}
          className={cn(
            "h-8 w-8 text-muted-foreground hover:text-primary",
            saved && "text-green-500 hover:text-green-500 cursor-not-allowed"
          )}
          aria-label={saved ? 'Song is saved offline' : 'Save song offline'}
        >
          {saved ? <Check /> : <Download />}
        </Button>
      </div>
    </div>
  );
}

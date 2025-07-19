
'use client'

import { useState, useEffect } from 'react';
import { getAllSavedSongs, type Song } from '@/lib/db';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import Image from 'next/image';
import Link from 'next/link';
import SongStatusButton from '@/components/SongStatusButton';
import { cn } from '@/lib/utils';
import { DownloadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';

function SongListItem({ song }: { song: Song }) {
  return (
    <div className={cn(
      "flex items-center space-x-4 p-2 rounded-lg transition-colors",
      "hover:bg-accent hover:text-accent-foreground group"
    )}>
      <Link href={`/lyrics/${song.id}`} className="flex-grow flex items-center space-x-4 min-w-0">
        <Image
          src={`https://placehold.co/80x80.png?text=${encodeURIComponent(song.title)}`}
          alt={`${song.title} album art`}
          width={40}
          height={40}
          className="rounded-md aspect-square object-cover"
          data-ai-hint="album cover"
        />
        <div className="min-w-0">
          <p className="font-semibold font-headline truncate">{song.title}</p>
          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
        </div>
      </Link>
      <div className="flex-shrink-0">
        <SongStatusButton song={song} />
      </div>
    </div>
  );
}

export default function DownloadedPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadSongs() {
      setIsLoading(true);
      const loadedSongs = await getAllSavedSongs();
      setSongs(loadedSongs);
      setIsLoading(false);
    }
    loadSongs();
  }, []);

  return (
    <div className="flex-grow flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="space-y-8">
          <h1 className="text-4xl font-headline font-bold tracking-tight">Downloaded Songs</h1>

          {isLoading ? (
            <p>Loading songs...</p>
          ) : songs.length > 0 ? (
            <div className="flex flex-col">
              {songs.map(song => (
                <SongListItem key={song.id} song={song} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full">
                <DownloadCloud className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-headline font-semibold">No Downloaded Songs</h2>
                <p className="text-muted-foreground">You haven&apos;t saved any songs for offline use.</p>
                <Button variant="link" asChild>
                    <Link href="/search">Find songs to download</Link>
                </Button>
            </div>
          )}
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

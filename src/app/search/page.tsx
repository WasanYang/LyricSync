
'use client';

import { useState, useMemo } from 'react';
import { getSongs, type Song } from '@/lib/songs';
import { Input } from '@/components/ui/input';
import { SearchIcon } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

function SongListItem({ song }: { song: Song }) {
  return (
    <Link href={`/lyrics/${song.id}`} className="block w-full">
      <div className={cn(
        "flex items-center space-x-4 p-2 rounded-lg transition-colors",
        "hover:bg-accent hover:text-accent-foreground"
      )}>
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
      </div>
    </Link>
  );
}


export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const allSongs = useMemo(() => getSongs(), []);

  const filteredSongs = useMemo(() => {
    if (!searchTerm) {
      return allSongs;
    }
    return allSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allSongs]);

  return (
    <div className="flex-grow flex flex-col">
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="space-y-8">
          <h1 className="text-4xl font-headline font-bold tracking-tight">Search</h1>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
            <Input
              type="search"
              placeholder="Search for songs or artists..."
              className="pl-10 text-base bg-black text-white dark:bg-white dark:text-black focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-gray-500 dark:placeholder:text-gray-400"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <section>
            <div className="flex flex-col">
              {filteredSongs.map((song) => (
                <SongListItem key={song.id} song={song} />
              ))}
            </div>
            {filteredSongs.length === 0 && searchTerm && (
              <div className="text-center py-16">
                <p className="text-muted-foreground">No songs found for &quot;{searchTerm}&quot;.</p>
              </div>
            )}
          </section>
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

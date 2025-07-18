'use client';

import { useState, useMemo } from 'react';
import { getSongs, type Song } from '@/lib/songs';
import { Input } from '@/components/ui/input';
import SongCard from '@/components/SongCard';
import { SearchIcon } from 'lucide-react';

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
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-headline font-bold tracking-tight">Search Songs</h1>
        <p className="text-muted-foreground mt-2">Find lyrics by title or artist.</p>
      </div>
      <div className="relative">
        <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          type="search"
          placeholder="e.g., Starlight Echoes or Celestial Sound"
          className="pl-10 text-base"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>
      <section>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-x-6 gap-y-8">
          {filteredSongs.map((song) => (
            <SongCard key={song.id} song={song} />
          ))}
        </div>
        {filteredSongs.length === 0 && (
          <div className="text-center py-16">
            <p className="text-muted-foreground">No songs found for &quot;{searchTerm}&quot;.</p>
          </div>
        )}
      </section>
    </div>
  );
}

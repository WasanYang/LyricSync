
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getSongs, type Song } from '@/lib/songs';
import { Input } from '@/components/ui/input';
import { SearchIcon } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import SongStatusButton from '@/components/SongStatusButton';
import Header from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';

function SongListItem({ song }: { song: Song }) {
  return (
    <div className={cn(
      "flex items-center space-x-3 p-2 rounded-lg transition-colors duration-200",
      "hover:bg-muted/50 group" 
    )}>
      <Link href={`/lyrics/${song.id}`} className="flex-grow flex items-center space-x-3 min-w-0">
        <Image
          src={`https://placehold.co/80x80.png?text=${encodeURIComponent(song.title)}`}
          alt={`${song.title} album art`}
          width={32}
          height={32}
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


export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const allSongs = useMemo(() => getSongs(), []);
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/welcome');
    }
  }, [user, loading, router]);


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

  if (loading || !user) {
    return (
      <div className="flex-grow flex flex-col">
         <Header />
         <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
            <div className="space-y-8">
               <Skeleton className="h-8 w-32" />
               <Skeleton className="h-10 w-full" />
               <div className="space-y-2 pt-4">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
               </div>
            </div>
         </main>
         <BottomNavBar />
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col">
       <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="space-y-8">
          <h1 className="text-3xl font-headline font-bold tracking-tight">Search</h1>
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
            <Input
              type="search"
              placeholder="Search for songs or artists..."
              className="pl-10 text-base bg-muted focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <section>
            <div className="flex flex-col space-y-1">
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


'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { type Song, getAllCloudSongs } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { SearchIcon, Music2 } from 'lucide-react';
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
      "group" 
    )}>
      <Link href={`/lyrics/${song.id}`} className="flex items-center space-x-3 p-2 rounded-lg transition-colors duration-200 hover:bg-muted/50">
        <Image
          src={`https://placehold.co/80x80.png`}
          alt={`${song.title} album art`}
          width={40}
          height={40}
          className="rounded-md aspect-square object-cover"
          data-ai-hint="album cover"
        />
        <div className="min-w-0 flex-grow">
          <p className="font-semibold font-headline truncate">{song.title}</p>
          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
        </div>
        <div className="flex-shrink-0" onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <SongStatusButton song={song} />
        </div>
      </Link>
    </div>
  );
}

function SearchCategory({ title, songs, isLoading }: { title: string; songs: Song[], isLoading?: boolean }) {
    if (isLoading) {
        return (
            <section>
                <h2 className="text-xl font-bold font-headline mb-4">
                  <Skeleton className="h-6 w-32" />
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
                </div>
            </section>
        )
    }

    return (
        <section>
            <h2 className="text-xl font-bold font-headline mb-4">{title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                {songs.map(song => <SongListItem key={song.id} song={song} />)}
            </div>
        </section>
    )
}


export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/welcome');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchSongs = async () => {
      setIsLoadingSongs(true);
      try {
        const cloudSongs = await getAllCloudSongs();
        // Only show system songs in public search
        const systemSongs = cloudSongs.filter(s => s.source === 'system');
        setAllSongs(systemSongs);
      } catch (error) {
        console.error("Failed to load songs for search:", error);
        // Optionally show a toast or error message
      } finally {
        setIsLoadingSongs(false);
      }
    };
    if(user) {
      fetchSongs();
    }
  }, [user]);

  const filteredSongs = useMemo(() => {
    if (!searchTerm) {
      return [];
    }
    return allSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allSongs]);

  const newReleases = useMemo(() => [...allSongs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4), [allSongs]);
  const trendingHits = useMemo(() => [...allSongs].sort(() => 0.5 - Math.random()).slice(0, 4), [allSongs]); // Placeholder
  const forYou = useMemo(() => [...allSongs].sort(() => 0.7 - Math.random()).slice(0, 4), [allSongs]); // Placeholder

  if (authLoading || !user) {
    return (
      <div className="flex-grow flex flex-col">
         <Header />
         <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
            <div className="space-y-8">
               <Skeleton className="h-10 w-full" />
               <div className="space-y-4">
                  <Skeleton className="h-6 w-32 mb-4" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                      <Skeleton className="h-14 w-full" />
                  </div>
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
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
            <Input
              type="search"
              placeholder="Search songs and artists..."
              className="pl-10 text-base bg-muted focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {searchTerm ? (
              <section>
                <div className="flex flex-col space-y-1">
                  {filteredSongs.length > 0 ? (
                    filteredSongs.map((song) => (
                      <SongListItem key={song.id} song={song} />
                    ))
                  ) : !isLoadingSongs ? (
                    <div className="text-center py-16">
                      <p className="text-muted-foreground">No songs found for &quot;{searchTerm}&quot;.</p>
                    </div>
                  ) : null }
                </div>
                {isLoadingSongs && (
                    <div className="space-y-2 mt-4">
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                    </div>
                )}
              </section>
          ) : (
            <div className="space-y-10">
                <SearchCategory title="New Releases" songs={newReleases} isLoading={isLoadingSongs} />
                <SearchCategory title="Trending Hits" songs={trendingHits} isLoading={isLoadingSongs} />
                <SearchCategory title="For You" songs={forYou} isLoading={isLoadingSongs} />
            </div>
          )}

        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

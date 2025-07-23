
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { type Song, getAllCloudSongs, type Setlist, getPublicSetlists } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { SearchIcon, Music2, ListMusic } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import SongStatusButton from '@/components/SongStatusButton';
import Header from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';


function SongListItem({ song }: { song: Song }) {
  return (
    <div className={cn(
      "group" 
    )}>
      <Link href={`/lyrics/${song.id}`} className="flex items-center space-x-3 p-2 rounded-lg transition-colors duration-200 hover:bg-muted/50">
        <Image
          src={`https://placehold.co/80x80.png?text=${encodeURIComponent(song.title)}`}
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

function SetlistCard({ setlist }: { setlist: Setlist }) {
    const songCount = setlist.songIds.length;
    return (
        <Link href={`/setlists/shared/${setlist.firestoreId}`} className="block">
            <Card className="hover:bg-muted/50 transition-colors">
                <CardContent className="p-4 flex items-center gap-4">
                    <div className="p-3 bg-muted rounded-md">
                        <ListMusic className="h-6 w-6 text-muted-foreground" />
                    </div>
                    <div>
                        <p className="font-semibold font-headline truncate">{setlist.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                            {songCount} {songCount === 1 ? 'song' : 'songs'} • by {setlist.authorName}
                        </p>
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
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

    if (songs.length === 0) return null;

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
  const [publicSetlists, setPublicSetlists] = useState<Setlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/welcome');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const [cloudSongs, publicLists] = await Promise.all([
            getAllCloudSongs(),
            getPublicSetlists()
        ]);
        const systemSongs = cloudSongs.filter(s => s.source === 'system');
        setAllSongs(systemSongs);
        setPublicSetlists(publicLists);
      } catch (error) {
        console.error("Failed to load search data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if(user) {
      fetchAllData();
    }
  }, [user]);

  const filteredSongs = useMemo(() => {
    if (!searchTerm) return [];
    return allSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allSongs]);
  
  const filteredSetlists = useMemo(() => {
    if (!searchTerm) return [];
    return publicSetlists.filter(
      (setlist) =>
        setlist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setlist.authorName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, publicSetlists]);

  const newReleases = useMemo(() => [...allSongs].sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()).slice(0, 4), [allSongs]);
  const trendingHits = useMemo(() => [...allSongs].sort(() => 0.5 - Math.random()).slice(0, 4), [allSongs]); // Placeholder

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
              placeholder="Search songs, artists, and public setlists..."
              className="pl-10 text-base bg-muted focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          {searchTerm ? (
              <div className="space-y-8">
                 {filteredSetlists.length > 0 && (
                     <section>
                         <h2 className="text-xl font-bold font-headline mb-4">Setlists</h2>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {filteredSetlists.map((setlist) => <SetlistCard key={setlist.firestoreId} setlist={setlist} />)}
                         </div>
                     </section>
                 )}
                 {filteredSongs.length > 0 && (
                      <section>
                         <h2 className="text-xl font-bold font-headline mb-4">Songs</h2>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
                            {filteredSongs.map((song) => <SongListItem key={song.id} song={song} />)}
                         </div>
                      </section>
                 )}
                 {!isLoading && filteredSongs.length === 0 && filteredSetlists.length === 0 && (
                    <div className="text-center py-16">
                      <p className="text-muted-foreground">No results for &quot;{searchTerm}&quot;.</p>
                    </div>
                 )}
                 {isLoading && (
                    <div className="space-y-2 mt-4">
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                    </div>
                )}
              </div>
          ) : (
            <div className="space-y-10">
                <SearchCategory title="New Releases" songs={newReleases} isLoading={isLoading} />
                <SearchCategory title="Trending Hits" songs={trendingHits} isLoading={isLoading} />
                <section>
                   <h2 className="text-xl font-bold font-headline mb-4">Browse Public Setlists</h2>
                    {isLoading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    ) : publicSetlists.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             {publicSetlists.slice(0, 4).map((setlist) => <SetlistCard key={setlist.firestoreId} setlist={setlist} />)}
                        </div>
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed rounded-lg">
                            <p className="text-muted-foreground">No public setlists available yet.</p>
                        </div>
                    )}
                </section>
            </div>
          )}

        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

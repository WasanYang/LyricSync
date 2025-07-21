
'use client'

import { getSongs, type Song } from '@/lib/songs';
import { getSetlists, type Setlist } from '@/lib/db';
import SongCard from '@/components/SongCard';
import Header from '@/components/Header';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import BottomNavBar from '@/components/BottomNavBar';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw, ListMusic, PlusCircle, ChevronRight, Music, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import PremiumCard from '@/components/PremiumCard';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import Image from 'next/image';

// In a real app, these would come from an API
const featuredSongs = getSongs().slice(0, 5);
const recentReleases = getSongs().slice(2, 6).reverse();
const popularHits = getSongs().slice(1, 6);

// Mock data for recommended setlists
const recommendedSetlists: (Setlist & { description: string })[] = [
    {
        id: 'rec-worship',
        title: 'Worship Classics',
        description: 'Timeless songs of praise.',
        songIds: ['4', '1'],
        userId: 'system',
        createdAt: Date.now(),
        isSynced: true,
        firestoreId: 'rec-worship'
    },
    {
        id: 'rec-acoustic',
        title: 'Acoustic Cafe',
        description: 'Chill vibes for a relaxed set.',
        songIds: ['2', '3'],
        userId: 'system',
        createdAt: Date.now(),
        isSynced: true,
        firestoreId: 'rec-acoustic'
    },
    {
        id: 'rec-upbeat',
        title: 'Upbeat Hits',
        description: 'Get the energy flowing.',
        songIds: ['2', '1', '3'],
        userId: 'system',
        createdAt: Date.now(),
        isSynced: true,
        firestoreId: 'rec-upbeat'
    }
];

function SongCarousel({ songs }: { songs: Song[] }) {
    return (
        <div className="w-full max-w-full -mr-4">
            <Carousel opts={{ align: "start", loop: false }} className="w-full">
                <CarouselContent className="-ml-4">
                    {songs.map((song) => (
                        <CarouselItem key={song.id} className="basis-[45%] sm:basis-1/4 md:basis-1/5 pl-4">
                            <Link href={`/lyrics/${song.id}`} className="block">
                                <SongCard song={song} />
                            </Link>
                        </CarouselItem>
                    ))}
                </CarouselContent>
            </Carousel>
        </div>
    )
}

function RecentSetlistItem({ setlist }: {setlist: Setlist}) {
    const songCount = setlist.songIds.length;
    return (
        <Link href={`/setlists/${setlist.id}`} className="block p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors">
            <div className="flex items-center justify-between">
                <div>
                    <p className="font-semibold font-headline truncate">{setlist.title}</p>
                    <p className="text-sm text-muted-foreground">{songCount} {songCount === 1 ? 'song' : 'songs'}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
        </Link>
    )
}

function RecommendedSetlistCard({ setlist }: { setlist: Setlist & { description: string } }) {
    const songCount = setlist.songIds.length;
    const firstSong = getSongs().find(s => s.id === setlist.songIds[0]);

    return (
        <Card className="w-full overflow-hidden group">
            <Link href={`/setlists/shared/${setlist.id}`} className="block">
                <CardContent className="p-0">
                     <div className="relative aspect-video">
                        {firstSong && (
                            <Image
                                src={`https://placehold.co/400x225.png?text=${encodeURIComponent(firstSong.title)}`}
                                alt={setlist.title}
                                fill
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                                data-ai-hint="stage lights"
                            />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/70 to-accent/20" />
                    </div>
                    <div className="p-4 bg-card">
                        <h3 className="font-semibold font-headline truncate">{setlist.title}</h3>
                        <p className="text-sm text-muted-foreground">{songCount} {songCount === 1 ? 'song' : 'songs'}</p>
                    </div>
                </CardContent>
            </Link>
        </Card>
    );
}

function LoadingSkeleton() {
    return (
       <div className="flex-grow flex flex-col">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8 space-y-12 pb-24 md:pb-8">
              {/* Welcome & Quick Actions Skeleton */}
              <div className="space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <div className="grid grid-cols-2 gap-4">
                      <Skeleton className="h-12 w-full" />
                      <Skeleton className="h-12 w-full" />
                  </div>
              </div>
              {/* Premium Card Skeleton */}
              <Skeleton className="h-28 w-full" />
              {/* Recent Setlists Skeleton */}
              <div className="space-y-4">
                  <Skeleton className="h-7 w-32" />
                  <div className="space-y-2">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                  </div>
              </div>
               {/* Recommended Songs Skeleton */}
               <div className="space-y-4">
                  <Skeleton className="h-7 w-40" />
                  <Skeleton className="h-10 w-full max-w-xs" />
                  <div className="flex space-x-4 pt-2">
                       <Skeleton className="h-36 w-[45%] sm:w-1/4" />
                       <Skeleton className="h-36 w-[45%] sm:w-1/4" />
                       <Skeleton className="h-36 hidden sm:block sm:w-1/4" />
                  </div>
               </div>
          </main>
          <BottomNavBar />
      </div>
    );
}

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [recentSetlists, setRecentSetlists] = useState<Setlist[]>([]);
  const [isLoadingSetlists, setIsLoadingSetlists] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/welcome');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function loadRecentSetlists() {
        if (!user) return;
        setIsLoadingSetlists(true);
        try {
            const allSetlists = await getSetlists(user.uid);
            const sorted = allSetlists.sort((a,b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt));
            setRecentSetlists(sorted.slice(0, 3));
        } catch (error) {
            console.error("Failed to load recent setlists", error);
        } finally {
            setIsLoadingSetlists(false);
        }
    }
    if (user) {
        loadRecentSetlists();
    }
  }, [user]);

  if (loading || !user) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="flex-grow flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 space-y-12 pb-24 md:pb-0">
        
        {/* Welcome & Quick Actions */}
        <section>
            <h1 className="text-2xl font-bold font-headline mb-4">
                Welcome back, {user.displayName ? user.displayName.split(' ')[0] : 'Guest'}!
            </h1>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                 <Button variant="outline" size="lg" className="justify-start" asChild>
                    <Link href="/setlists">
                        <ListMusic className="mr-3 h-5 w-5" /> My Setlists
                    </Link>
                </Button>
                <Button variant="outline" size="lg" className="justify-start" asChild>
                    <Link href="/downloaded">
                        <Music className="mr-3 h-5 w-5" /> My Library
                    </Link>
                </Button>
            </div>
        </section>

        {/* Premium Card */}
        <PremiumCard />

        {/* Recent Setlists */}
        {isLoadingSetlists ? (
            <div className="space-y-4">
                <Skeleton className="h-7 w-32" />
                <div className="space-y-2">
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                </div>
            </div>
        ) : recentSetlists.length > 0 && (
            <section>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-headline font-semibold">Recent Setlists</h2>
                    <Button variant="link" asChild>
                        <Link href="/setlists">View All</Link>
                    </Button>
                </div>
                <div className="space-y-2">
                    {recentSetlists.map(setlist => <RecentSetlistItem key={setlist.id} setlist={setlist} />)}
                </div>
            </section>
        )}
        
         {/* Recommended Setlists */}
         <section>
            <h2 className="text-xl font-headline font-semibold mb-4">Recommended Setlists</h2>
             <div className="w-full max-w-full -mr-4">
                <Carousel opts={{ align: "start", loop: false }} className="w-full">
                    <CarouselContent className="-ml-4">
                        {recommendedSetlists.map(setlist => (
                            <CarouselItem key={setlist.id} className="basis-2/3 sm:basis-1/3 pl-4">
                                <RecommendedSetlistCard setlist={setlist} />
                            </CarouselItem>
                        ))}
                    </CarouselContent>
                </Carousel>
            </div>
        </section>

        {/* Recommended Songs */}
        <section>
            <h2 className="text-xl font-headline font-semibold mb-4">Recommended Songs</h2>
            <Tabs defaultValue="featured" className="w-full">
              <TabsList>
                <TabsTrigger value="featured">Featured</TabsTrigger>
                <TabsTrigger value="popular">Popular</TabsTrigger>
                <TabsTrigger value="recent">Recent</TabsTrigger>
              </TabsList>
              <TabsContent value="featured" className="pt-4">
                <SongCarousel songs={featuredSongs} />
              </TabsContent>
              <TabsContent value="popular" className="pt-4">
                <SongCarousel songs={popularHits} />
              </TabsContent>
              <TabsContent value="recent" className="pt-4">
                <SongCarousel songs={recentReleases} />
              </TabsContent>
            </Tabs>
        </section>

      </main>
      <Footer />
      <BottomNavBar />
    </div>
  );
}

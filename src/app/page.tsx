
'use client';

import {
  getSetlists,
  type Setlist,
  getAllCloudSongs,
  getPublicSetlists,
} from '@/lib/db';
import type { Song } from '@/lib/songs';
import SongCard from '@/components/SongCard';
import Header from '@/components/Header';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BottomNavBar from '@/components/BottomNavBar';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { ListMusic, ChevronRight, Music, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Footer from '@/components/Footer';
import Image from 'next/image';

function SongCarousel({
  songs,
  isLoading,
}: {
  songs: Song[];
  isLoading?: boolean;
}) {
  if (isLoading) {
    return (
      <div className='flex space-x-4 -ml-4 w-full max-w-full'>
        <div className='basis-[45%] sm:basis-1/4 md:basis-1/5 pl-4'>
          <Skeleton className='aspect-square w-full' />
          <Skeleton className='h-4 w-3/4 mt-2' />
          <Skeleton className='h-3 w-1/2 mt-1' />
        </div>
        <div className='basis-[45%] sm:basis-1/4 md:basis-1/5 pl-4'>
          <Skeleton className='aspect-square w-full' />
          <Skeleton className='h-4 w-3/4 mt-2' />
          <Skeleton className='h-3 w-1/2 mt-1' />
        </div>
        <div className='hidden sm:block sm:basis-1/4 md:basis-1/5 pl-4'>
          <Skeleton className='aspect-square w-full' />
          <Skeleton className='h-4 w-3/4 mt-2' />
          <Skeleton className='h-3 w-1/2 mt-1' />
        </div>
        <div className='hidden md:block md:basis-1/5 pl-4'>
          <Skeleton className='aspect-square w-full' />
          <Skeleton className='h-4 w-3/4 mt-2' />
          <Skeleton className='h-3 w-1/2 mt-1' />
        </div>
      </div>
    );
  }

  return (
    <div className='w-full max-w-full -mr-4'>
      <Carousel opts={{ align: 'start', loop: false }} className='w-full'>
        <CarouselContent className='-ml-4'>
          {songs.map((song) => (
            <CarouselItem
              key={song.id}
              className='basis-[45%] sm:basis-1/4 md:basis-1/5 pl-4'
            >
              <Link href={`/lyrics/${song.id}`} className='block'>
                <SongCard song={song} />
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

function RecentSetlistItem({ setlist }: { setlist: Setlist }) {
  const isOwner = setlist.source !== 'saved';
  const songCount = setlist.songIds.length;
  const linkHref = isOwner
    ? `/setlists/${setlist.id}`
    : `/shared/setlists/${setlist.firestoreId}`;

  return (
    <Link
      href={linkHref}
      className='block p-3 rounded-lg bg-muted hover:bg-muted/80 transition-colors'
    >
      <div className='flex items-center justify-between'>
        <div className='flex items-center gap-3'>
          {isOwner ? (
            <ListMusic className='h-5 w-5 text-muted-foreground flex-shrink-0' />
          ) : (
            <User className='h-5 w-5 text-purple-500 flex-shrink-0' />
          )}
          <div>
            <p className='font-semibold font-headline truncate'>
              {setlist.title}
            </p>
            <p className='text-sm text-muted-foreground'>
              {isOwner
                ? `${songCount} ${songCount === 1 ? 'song' : 'songs'}`
                : `By ${setlist.authorName}`}
            </p>
          </div>
        </div>
        <ChevronRight className='h-5 w-5 text-muted-foreground' />
      </div>
    </Link>
  );
}

function RecommendedSetlistCard({
  setlist,
}: {
  setlist: Setlist & { description?: string };
}) {
  const songCount = setlist.songIds.length;

  return (
    <Link
      href={`/shared/setlists/${setlist.firestoreId}`}
      className='block group'
    >
      <div className='group relative space-y-1.5'>
        <div className='aspect-square w-full overflow-hidden rounded-md transition-all duration-300 ease-in-out group-hover:shadow-lg group-hover:shadow-primary/20'>
          <Image
            src={`https://placehold.co/300x300.png?text=${encodeURIComponent(
              setlist.title
            )}`}
            alt={setlist.title}
            width={300}
            height={300}
            className='h-full w-full object-cover transition-transform duration-300 group-hover:scale-105'
            data-ai-hint='stage lights'
          />
        </div>
        <div className='flex-grow min-w-0'>
          <p className='font-semibold font-headline text-sm truncate'>
            {setlist.title}
          </p>
          <p className='text-xs text-muted-foreground truncate'>
            {songCount} {songCount === 1 ? 'song' : 'songs'}
          </p>
        </div>
      </div>
    </Link>
  );
}

function LoadingSkeleton() {
  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 space-y-12 pb-24 md:pb-8'>
        {/* Welcome & Quick Actions Skeleton */}
        <div className='space-y-4'>
          <Skeleton className='h-8 w-48' />
          <div className='grid grid-cols-2 gap-4'>
            <Skeleton className='h-12 w-full' />
            <Skeleton className='h-12 w-full' />
          </div>
        </div>
        {/* Premium Card Skeleton */}
        <Skeleton className='h-28 w-full' />
        {/* Recent Setlists Skeleton */}
        <div className='space-y-4'>
          <Skeleton className='h-7 w-32' />
          <div className='space-y-2'>
            <Skeleton className='h-16 w-full' />
            <Skeleton className='h-16 w-full' />
          </div>
        </div>
        {/* Recommended Songs Skeleton */}
        <div className='space-y-4'>
          <Skeleton className='h-7 w-40' />
          <Skeleton className='h-10 w-full max-w-xs' />
          <div className='flex space-x-4 pt-2'>
            <Skeleton className='h-36 w-[45%] sm:w-1/4' />
            <Skeleton className='h-36 w-[45%] sm:w-1/4' />
            <Skeleton className='h-36 hidden sm:block sm:w-1/4' />
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
  const [systemSongs, setSystemSongs] = useState<Song[]>([]);
  const [publicSetlists, setPublicSetlists] = useState<Setlist[]>([]);
  const [isLoadingSetlists, setIsLoadingSetlists] = useState(true);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [isLoadingPublicSetlists, setIsLoadingPublicSetlists] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/welcome');
    }
  }, [user, loading, router]);

  useEffect(() => {
    async function loadData() {
      if (!user) return;

      setIsLoadingSetlists(true);
      setIsLoadingSongs(true);
      setIsLoadingPublicSetlists(true);

      try {
        const allSetlists = await getSetlists(user.uid);
        const sorted = allSetlists.sort(
          (a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)
        );
        setRecentSetlists(sorted.slice(0, 3));
      } catch (error) {
        console.error('Failed to load recent setlists', error);
      } finally {
        setIsLoadingSetlists(false);
      }

      try {
        const allSongs = await getAllCloudSongs();
        const filteredSystemSongs = allSongs.filter(
          (song) => song.source === 'system'
        );
        setSystemSongs(filteredSystemSongs);
      } catch (error) {
        console.error('Failed to load system songs', error);
      } finally {
        setIsLoadingSongs(false);
      }

      try {
        const publicLists = await getPublicSetlists();
        // Filter out the user's own setlists from recommendations
        const recommendedSetlists = publicLists.filter(
          (sl) => sl.userId !== user.uid
        );
        setPublicSetlists(recommendedSetlists);
      } catch (error) {
        console.error('Failed to load public setlists', error);
      } finally {
        setIsLoadingPublicSetlists(false);
      }
    }
    if (user) {
      loadData();
    }
  }, [user]);

  if (loading || !user) {
    return <LoadingSkeleton />;
  }

  const featuredSongs = systemSongs.slice(0, 5);
  const recentReleases = [...systemSongs]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )
    .slice(0, 5);
  const popularHits = [...systemSongs]
    .sort(() => 0.5 - Math.random())
    .slice(0, 5); // Mock popularity with random sort for now

  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 space-y-12 pb-24 md:pb-12'>
        {/* Welcome & Quick Actions */}
        {!user.isAnonymous && (
          <section>
            <h1 className='text-2xl font-bold font-headline mb-4'>
              Welcome back,{' '}
              {user.displayName ? user.displayName.split(' ')[0] : 'Guest'}!
            </h1>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
              <Button
                variant='outline'
                size='lg'
                className='justify-start'
                asChild
              >
                <Link href='/setlists'>
                  <ListMusic className='mr-3 h-5 w-5' /> My Setlists
                </Link>
              </Button>
              <Button
                variant='outline'
                size='lg'
                className='justify-start'
                asChild
              >
                <Link href='/library'>
                  <Music className='mr-3 h-5 w-5' /> My Library
                </Link>
              </Button>
            </div>
          </section>
        )}

        {/* Premium Card Implement in future */}
        {/* <PremiumCard /> */}

        {/* Recent Setlists */}
        {isLoadingSetlists ? (
          <div className='space-y-4'>
            <Skeleton className='h-7 w-32' />
            <div className='space-y-2'>
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-16 w-full' />
            </div>
          </div>
        ) : (
          recentSetlists.length > 0 && (
            <section>
              <div className='flex items-center justify-between mb-4'>
                <h2 className='text-xl font-headline font-semibold'>
                  Recent Setlists
                </h2>
                <Button variant='link' asChild>
                  <Link href='/setlists'>View All</Link>
                </Button>
              </div>
              <div className='space-y-2'>
                {recentSetlists.map((setlist) => (
                  <RecentSetlistItem key={setlist.id} setlist={setlist} />
                ))}
              </div>
            </section>
          )
        )}

        {/* Recommended Setlists */}
        {publicSetlists.length > 0 && (
          <section>
            <h2 className='text-xl font-headline font-semibold mb-4'>
              Recommended Setlists
            </h2>
            {isLoadingPublicSetlists ? (
              <div className='flex space-x-4 -ml-4 w-full max-w-full'>
                <div className='basis-[45%] sm:basis-1/4 md:basis-1/5 pl-4'>
                  <Skeleton className='aspect-square w-full' />
                  <Skeleton className='h-4 w-3/4 mt-2' />
                  <Skeleton className='h-3 w-1/2 mt-1' />
                </div>
                <div className='basis-[45%] sm:basis-1/4 md:basis-1/5 pl-4'>
                  <Skeleton className='aspect-square w-full' />
                  <Skeleton className='h-4 w-3/4 mt-2' />
                  <Skeleton className='h-3 w-1/2 mt-1' />
                </div>
                <div className='hidden sm:block sm:basis-1/4 md:basis-1/5 pl-4'>
                  <Skeleton className='aspect-square w-full' />
                  <Skeleton className='h-4 w-3/4 mt-2' />
                  <Skeleton className='h-3 w-1/2 mt-1' />
                </div>
                <div className='hidden md:block md:basis-1/5 pl-4'>
                  <Skeleton className='aspect-square w-full' />
                  <Skeleton className='h-4 w-3/4 mt-2' />
                  <Skeleton className='h-3 w-1/2 mt-1' />
                </div>
              </div>
            ) : (
              <div className='w-full max-w-full -mr-4'>
                <Carousel
                  opts={{ align: 'start', loop: false }}
                  className='w-full'
                >
                  <CarouselContent className='-ml-4'>
                    {publicSetlists.map((setlist) => (
                      <CarouselItem
                        key={setlist.firestoreId}
                        className='basis-[45%] sm:basis-1/4 md:basis-1/5 pl-4'
                      >
                        <RecommendedSetlistCard setlist={setlist} />
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              </div>
            )}
          </section>
        )}

        {/* Recommended Songs */}
        <section>
          <h2 className='text-xl font-headline font-semibold mb-4'>
            Recommended Songs
          </h2>
          <Tabs defaultValue='featured' className='w-full'>
            <TabsList>
              <TabsTrigger value='featured'>Featured</TabsTrigger>
              <TabsTrigger value='popular'>Popular</TabsTrigger>
              <TabsTrigger value='recent'>Recent</TabsTrigger>
            </TabsList>
            <TabsContent value='featured' className='pt-4'>
              <SongCarousel songs={featuredSongs} isLoading={isLoadingSongs} />
            </TabsContent>
            <TabsContent value='popular' className='pt-4'>
              <SongCarousel songs={popularHits} isLoading={isLoadingSongs} />
            </TabsContent>
            <TabsContent value='recent' className='pt-4'>
              <SongCarousel songs={recentReleases} isLoading={isLoadingSongs} />
            </TabsContent>
          </Tabs>
        </section>
      </main>
      <Footer />
      <BottomNavBar />
    </div>
  );
}

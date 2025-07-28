'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from './ui/skeleton';
import { useTranslation } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { Song } from '@/lib/songs';
import { Carousel, CarouselContent, CarouselItem } from './ui/carousel';
import Link from 'next/link';
import SongCard from './SongCard';

function SongCarousel({
  songs,
  isLoading,
}: {
  songs: Song[];
  isLoading?: boolean;
}) {
  const { user } = useAuth();
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
              <Link
                href={
                  !user || user.isAnonymous
                    ? `/shared/song/${song.id}`
                    : `/lyrics/${song.id}`
                }
                className='block'
              >
                <SongCard song={song} />
              </Link>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

export default function RecommendedSongs({
  featuredSongs,
  popularHits,
  recentReleases,
  isLoadingSongs,
}: {
  featuredSongs: Song[];
  popularHits: Song[];
  recentReleases: Song[];
  isLoadingSongs?: boolean;
}) {
  if (isLoadingSongs) {
    return (
      <div className='space-y-8'>
        <div className='space-y-4'>
          <Skeleton className='h-7 w-40' />
          <SongCarousel songs={[]} isLoading={true} />
        </div>
        <div className='space-y-4'>
          <Skeleton className='h-7 w-32' />
          <Skeleton className='h-10 w-full max-w-xs' />
          <SongCarousel songs={[]} isLoading={true} />
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {recentReleases.length > 0 && (
        <section>
          <h2 className='text-xl font-headline font-semibold mb-4'>
            New Releases
          </h2>
          <SongCarousel songs={recentReleases} />
        </section>
      )}

      <section>
        <Tabs defaultValue='featured' className='w-full'>
          <TabsList>
            <TabsTrigger value='featured'>Featured</TabsTrigger>
            <TabsTrigger value='popular'>Popular</TabsTrigger>
          </TabsList>
          <TabsContent value='featured' className='pt-4'>
            <SongCarousel songs={featuredSongs} />
          </TabsContent>
          <TabsContent value='popular' className='pt-4'>
            <SongCarousel songs={popularHits} />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

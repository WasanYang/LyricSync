// src/components/RecommendedSongs.tsx
'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from './ui/skeleton';
import { Song } from '@/lib/songs';
import { useTranslations } from 'next-intl';
import SongList from './SongList'; // Changed from SongCarousel
import { Button } from './ui/button';
import LocalsLink from './ui/LocalsLink';

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
  const t = useTranslations();
  if (isLoadingSongs) {
    return (
      <div className='space-y-8'>
        <div className='space-y-4'>
          <Skeleton className='h-7 w-40' />
          <div className='space-y-2'>
            <Skeleton className='h-14 w-full' />
            <Skeleton className='h-14 w-full' />
          </div>
        </div>
        <div className='space-y-4'>
          <Skeleton className='h-7 w-32' />
          <Skeleton className='h-10 w-full max-w-xs' />
          <div className='space-y-2'>
            <Skeleton className='h-14 w-full' />
            <Skeleton className='h-14 w-full' />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-8'>
      {recentReleases.length > 0 && (
        <section>
          <div className='flex items-center justify-between mb-2'>
            <h2 className='text-xl font-headline font-semibold'>
              {t('newReleases')}
            </h2>
            <Button variant='link' asChild>
              <LocalsLink href='/songs/new'>{t('home.viewAll')}</LocalsLink>
            </Button>
          </div>
          <SongList songs={recentReleases} />
        </section>
      )}

      <section>
        <Tabs defaultValue='featured' className='w-full'>
          <TabsList>
            <TabsTrigger value='featured'>{t('featured')}</TabsTrigger>
            <TabsTrigger value='popular'>{t('popular')}</TabsTrigger>
          </TabsList>
          <TabsContent value='featured' className='pt-4'>
            <SongList songs={featuredSongs} />
          </TabsContent>
          <TabsContent value='popular' className='pt-4'>
            <SongList songs={popularHits} />
          </TabsContent>
        </Tabs>
      </section>
    </div>
  );
}

'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from './ui/skeleton';
import { Song } from '@/lib/songs';
import { useTranslations } from 'next-intl';
import { SongCarousel } from './SongCarousel';

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
            {t('newReleases')}
          </h2>
          <SongCarousel songs={recentReleases} />
        </section>
      )}

      <section>
        <Tabs defaultValue='featured' className='w-full'>
          <TabsList>
            <TabsTrigger value='featured'>{t('featured')}</TabsTrigger>
            <TabsTrigger value='popular'>{t('popular')}</TabsTrigger>
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

'use client';

import { type Setlist } from '@/lib/db';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from '@/components/ui/carousel';
import { Skeleton } from '@/components/ui/skeleton';
import RecommendedSetlistCard from '@/components/RecommendedSetlistCard';

export default function RecommendedSetlists({
  publicSetlists,
  isLoadingPublicSetlists,
}: {
  publicSetlists: Setlist[];
  isLoadingPublicSetlists: boolean;
}) {
  return (
    <>
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
    </>
  );
}

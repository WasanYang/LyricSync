// This component is no longer used on the homepage and will be removed in a future cleanup.
// It is kept for now to avoid breaking changes in other parts of the app that might still use it.
import { Song } from '@/lib/songs';
import { Skeleton } from './ui/skeleton';
import { Carousel, CarouselContent, CarouselItem } from './ui/carousel';
import Link from 'next/link';
import SongCard from './SongCard';
import LocalsLink from './ui/LocalsLink';

export function SongCarousel({
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
          {songs.map((song, idx) => (
            <CarouselItem
              key={song.id}
              className='basis-[45%] sm:basis-1/4 md:basis-1/5 pl-4'
            >
              <LocalsLink href={`/shared/song/${song.id}`} className='block'>
                <SongCard song={song} idx={idx} />
              </LocalsLink>
            </CarouselItem>
          ))}
        </CarouselContent>
      </Carousel>
    </div>
  );
}

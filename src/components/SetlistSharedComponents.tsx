import type { Song } from '@/lib/songs';
import Link from 'next/link';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import LocalsLink from './ui/LocalsLink';

interface SongItemProps {
  song: Song;
  linkPrefix?: string;
}

export function SongItem({ song, linkPrefix = '/lyrics' }: SongItemProps) {
  return (
    <LocalsLink
      href={`${linkPrefix}/${song.id}`}
      className='flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors'
    >
      <Image
        src={`https://placehold.co/80x80.png?text=${encodeURIComponent(
          song.title
        )}`}
        alt={`${song.title} album art`}
        width={48}
        height={48}
        className='rounded-md aspect-square object-cover'
        data-ai-hint='album cover'
      />
      <div className='flex-grow min-w-0'>
        <p className='font-semibold font-headline truncate'>{song.title}</p>
        <p className='text-sm text-muted-foreground truncate'>{song.artist}</p>
      </div>
      <div className='text-sm text-muted-foreground'>
        Key: {song.originalKey || 'N/A'}
      </div>
    </LocalsLink>
  );
}

export function SetlistSkeleton() {
  return (
    <div className='space-y-8'>
      <div className='space-y-3 pt-8 text-center'>
        <Skeleton className='h-10 w-3/4 mx-auto' />
        <Skeleton className='h-5 w-24 mx-auto' />
      </div>
      <div className='flex justify-center gap-4'>
        <Skeleton className='h-11 w-48' />
      </div>
      <div className='space-y-2'>
        <Skeleton className='h-14 w-full' />
        <Skeleton className='h-14 w-full' />
        <Skeleton className='h-14 w-full' />
      </div>
    </div>
  );
}

import { Song } from '@/lib/songs';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import SongStatusButton from '@/components/SongStatusButton';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
import LocalsLink from '@/components/ui/LocalsLink';

export default function SongListItem({ song }: { song: Song }) {
  const { user } = useAuth();
  const [previewUrl, setPreviewUrl] = useState<string>();
  useEffect(() => {
    // if (!user) {
    setPreviewUrl('/shared/song/' + song.id);
    // } else {
    //   setPreviewUrl('/lyrics/' + song.id);
    // }
  }, [user, song.id]);

  return (
    <div className={cn('group')}>
      <LocalsLink
        href={previewUrl || `/lyrics/${song.id}`}
        className='flex items-center space-x-3 p-2 rounded-lg transition-colors duration-200 hover:bg-muted/50'
      >
        <Image
          src={`https://placehold.co/80x80.png?text=${encodeURIComponent(
            song.title
          )}`}
          alt={`${song.title} album art`}
          width={40}
          height={40}
          className='rounded-md aspect-square object-cover flex-shrink-0'
          data-ai-hint='album cover'
        />
        <div
          className={cn(
            'min-w-0 flex-grow',
            !song.artist && 'flex items-center'
          )}
        >
          <div>
            <p className='font-normal font-headline text-sm truncate'>
              {song.title}
            </p>
            {song.artist && (
              <div className='flex items-center gap-4 text-xs text-muted-foreground truncate'>
                <p>{song.artist}</p>
              </div>
            )}
          </div>
        </div>
        <div
          className='flex-shrink-0'
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
        >
          <SongStatusButton song={song} />
        </div>
      </LocalsLink>
    </div>
  );
}

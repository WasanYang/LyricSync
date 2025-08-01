import { Song } from '@/lib/songs';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import SongStatusButton from '@/components/SongStatusButton';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState } from 'react';
export default function SongListItem({ song }: { song: Song }) {
  const { user } = useAuth();
  const [previewUrl, setPreviewUrl] = useState<string>();
  useEffect(() => {
    // if (!user) {
    setPreviewUrl('/shared/song/' + song.id);
    // } else {
    //   setPreviewUrl('/lyrics/' + song.id);
    // }
  }, [user]);

  return (
    <div className={cn('group')}>
      <Link
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
          className='rounded-md aspect-square object-cover'
          data-ai-hint='album cover'
        />
        <div className='min-w-0 flex-grow'>
          <p className='font-semibold font-headline truncate'>{song.title}</p>
          <p className='text-sm text-muted-foreground truncate'>
            {song.artist}
          </p>
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
      </Link>
    </div>
  );
}

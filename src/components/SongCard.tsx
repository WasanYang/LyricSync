// src/components/SongCard.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { type Song } from '@/lib/songs';
import SongStatusButton from './SongStatusButton';

interface SongCardProps {
  song: Song;
}

export default function SongCard({ song }: SongCardProps) {
  return (
    <div className="group relative space-y-3">
       <Link href={`/lyrics/${song.id}`} className="block">
        <div className="aspect-square w-full overflow-hidden rounded-md transition-all duration-300 ease-in-out group-hover:shadow-lg">
          <Image
            src={`https://placehold.co/300x300.png?text=${encodeURIComponent(song.title)}`}
            alt={`${song.title} album art`}
            width={300}
            height={300}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            data-ai-hint="album cover"
          />
        </div>
      </Link>
      
      <div className="flex justify-between items-start gap-2">
        <Link href={`/lyrics/${song.id}`} className="block flex-grow min-w-0">
          <p className="font-semibold font-headline truncate">{song.title}</p>
          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
        </Link>
        <SongStatusButton song={song} />
      </div>
    </div>
  );
}

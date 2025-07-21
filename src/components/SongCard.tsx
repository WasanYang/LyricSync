
// src/components/SongCard.tsx
'use client';

import Image from 'next/image';
import { type Song } from '@/lib/songs';
import SongStatusButton from './SongStatusButton';

interface SongCardProps {
  song: Song;
}

export default function SongCard({ song }: SongCardProps) {
  
  // This stops the click from propagating to the parent Link component,
  // ensuring that clicking the button only performs its action (e.g., download)
  // without navigating to the song's lyric page.
  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  
  return (
    <div className="group relative space-y-1.5">
      <div className="aspect-square w-full overflow-hidden rounded-md transition-all duration-300 ease-in-out group-hover:shadow-lg group-hover:shadow-primary/20">
        <Image
          src={`https://placehold.co/300x300.png`}
          alt={`${song.title} album art`}
          width={300}
          height={300}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          data-ai-hint="album cover"
        />
      </div>
      
      <div className="flex justify-between items-start gap-2">
        <div className="flex-grow min-w-0">
          <p className="font-semibold font-headline text-sm truncate">{song.title}</p>
          <p className="text-xs text-muted-foreground truncate">{song.artist}</p>
        </div>
        <div onClick={handleButtonClick} className="flex-shrink-0 pt-0.5">
          <SongStatusButton song={song} />
        </div>
      </div>
    </div>
  );
}

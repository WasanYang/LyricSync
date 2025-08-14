// src/components/SongList.tsx
import type { Song } from '@/lib/songs';
import SongListItem from '@/app/[locale]/(public)/search/component/SongListItem';

interface SongListProps {
  songs: Song[];
  isLoading?: boolean;
}

export default function SongList({ songs, isLoading }: SongListProps) {
  if (isLoading) {
    return <div className='text-center'>Loading...</div>;
  }
  return (
    <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1'>
      {songs.map((song) => (
        <SongListItem key={song.id} song={song} />
      ))}
    </div>
  );
}

// src/components/admin/SongList.tsx
import type { Song } from '@/lib/songs';
import SongListItem from './SongListItem';

interface SongListProps {
  songs: Song[];
  onDelete: (song: Song) => void;
}

export default function SongList({ songs, onDelete }: SongListProps) {
  return (
    <ul className='space-y-2'>
      {songs.map((song) => (
        <SongListItem key={song.id} song={song} onDelete={onDelete} />
      ))}
    </ul>
  );
}

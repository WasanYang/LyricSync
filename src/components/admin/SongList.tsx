// src/components/admin/SongList.tsx
import type { Song } from '@/lib/songs';
import SongListItem from './SongListItem';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface SongListProps {
  songs: Song[];
  onDelete: (song: Song) => void;
}

export default function SongList({ songs, onDelete }: SongListProps) {
  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[300px] sm:w-[200px]'>Title</TableHead>
            <TableHead className='w-[200px] hidden md:table-cell'>
              Artist
            </TableHead>
            <TableHead className='w-[50px] hidden lg:table-cell'>Key</TableHead>
            <TableHead className='w-[100px] hidden lg:table-cell'>
              Source
            </TableHead>
            <TableHead className='w-[100px] hidden xl:table-cell'>
              Updated
            </TableHead>
            <TableHead className='w-[120px] text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {songs.map((song) => (
            <SongListItem key={song.id} song={song} onDelete={onDelete} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

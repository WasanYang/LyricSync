// src/components/admin/UserUploadsList.tsx
import type { Song } from '@/lib/songs';
import UserUploadsListItem from './UserUploadsListItem';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UserUploadsListProps {
  songs: Song[];
}

export default function UserUploadsList({ songs }: UserUploadsListProps) {
  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[250px] sm:w-[200px]'>Title</TableHead>
            <TableHead className='w-[150px] hidden md:table-cell'>
              Artist
            </TableHead>
            <TableHead className='w-[50px] hidden lg:table-cell'>Key</TableHead>
            <TableHead className='w-[150px] hidden lg:table-cell'>
              Uploader
            </TableHead>
            <TableHead className='w-[100px] hidden xl:table-cell'>
              Uploaded
            </TableHead>
            <TableHead className='w-[100px] text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {songs.map((song) => (
            <UserUploadsListItem key={song.id} song={song} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

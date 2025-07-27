// src/components/admin/UserSetlistsList.tsx
import type { Setlist } from '@/lib/db';
import UserSetlistsListItem from './UserSetlistsListItem';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UserSetlistsListProps {
  setlists: Setlist[];
}

export default function UserSetlistsList({ setlists }: UserSetlistsListProps) {
  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[300px] sm:w-[250px]'>Title</TableHead>
            <TableHead className='w-[100px] hidden md:table-cell'>
              Songs
            </TableHead>
            <TableHead className='w-[150px] hidden lg:table-cell'>
              Author
            </TableHead>
            <TableHead className='w-[100px] hidden xl:table-cell'>
              Created
            </TableHead>
            <TableHead className='w-[100px] text-right'>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {setlists.map((setlist) => (
            <UserSetlistsListItem key={setlist.firestoreId} setlist={setlist} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

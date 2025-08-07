// src/components/admin/UserList.tsx
import type { User } from '@/lib/types/database';
import UserListItem from './UserListItem';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface UserListProps {
  users: User[];
}

export default function UserList({ users }: UserListProps) {
  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-[250px]'>Display Name</TableHead>
            <TableHead className='hidden md:table-cell'>Email</TableHead>
            <TableHead className='hidden lg:table-cell'>Content</TableHead>
            <TableHead className='hidden lg:table-cell'>Last Login</TableHead>
            <TableHead className='text-right'>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <UserListItem key={user.uid} user={user} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// src/components/admin/UserListItem.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { TableCell, TableRow } from '@/components/ui/table';
import type { User } from '@/lib/types/database';
import { ListMusic, Music } from 'lucide-react';

interface UserListItemProps {
  user: User;
}

function formatDate(date: Date | number): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  if (!dateObj || isNaN(dateObj.getTime())) {
    return 'N/A';
  }
  return dateObj.toLocaleDateString('en-CA');
}

function obfuscateEmail(email: string): string {
  if (!email || !email.includes('@')) {
    return email;
  }
  const [localPart, domain] = email.split('@');
  if (localPart.length <= 2) {
    return `${localPart}...@${domain}`;
  }
  return `${localPart.substring(0, 2)}...@${domain}`;
}

export default function UserListItem({ user }: UserListItemProps) {
  return (
    <TableRow className='hover:bg-muted/50'>
      <TableCell>
        <div className='flex items-center gap-3'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={user.photoURL} alt={user.displayName} />
            <AvatarFallback>
              {user.displayName?.[0].toUpperCase() ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <span className='font-medium truncate'>{user.displayName}</span>
        </div>
      </TableCell>
      <TableCell className='hidden md:table-cell truncate'>
        {user.email ? obfuscateEmail(user.email) : 'No Email'}
      </TableCell>
      <TableCell className='hidden lg:table-cell'>
        <div className='flex items-center gap-4 text-sm text-muted-foreground'>
          <div className='flex items-center gap-1'>
            <Music className='h-3 w-3' />
            <span>{user.songsCount || 0}</span>
          </div>
          <div className='flex items-center gap-1'>
            <ListMusic className='h-3 w-3' />
            <span>{user.setlistsCount || 0}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className='hidden lg:table-cell text-sm text-muted-foreground'>
        {formatDate(user.updatedAt)}
      </TableCell>
      <TableCell className='text-right'>
        {user.isSuperAdmin && <Badge>Super Admin</Badge>}
      </TableCell>
    </TableRow>
  );
}

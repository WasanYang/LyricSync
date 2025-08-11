// src/components/admin/UserSetlistsListItem.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Setlist } from '@/lib/db';
import LocalsLink from '../ui/LocalsLink';

interface UserSetlistsListItemProps {
  setlist: Setlist;
}

function formatDate(date: Date | number): string {
  const dateObj = typeof date === 'number' ? new Date(date) : date;
  return dateObj.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function UserSetlistsListItem({
  setlist,
}: UserSetlistsListItemProps) {
  return (
    <TableRow className='hover:bg-muted/50'>
      <TableCell className='font-medium max-w-0'>
        <LocalsLink
          href={`/shared/setlists/${setlist.firestoreId}`}
          className='hover:underline text-blue-600 hover:text-blue-800 block truncate'
          title={setlist.title}
        >
          {setlist.title}
        </LocalsLink>
      </TableCell>
      <TableCell className='hidden md:table-cell'>
        <Badge variant='outline' className='text-xs'>
          {setlist.songIds.length}{' '}
          {setlist.songIds.length === 1 ? 'song' : 'songs'}
        </Badge>
      </TableCell>
      <TableCell className='hidden lg:table-cell max-w-0'>
        <div className='truncate' title={setlist.authorName || 'Unknown'}>
          {setlist.authorName || 'Unknown'}
        </div>
      </TableCell>
      <TableCell className='hidden xl:table-cell text-sm text-muted-foreground'>
        {setlist.createdAt ? formatDate(setlist.createdAt) : 'Unknown'}
      </TableCell>
      <TableCell className='text-right'>
        <div className='flex items-center gap-1 justify-end'>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant='ghost' size='sm'>
                  <LocalsLink
                    href={`/shared/setlists/${setlist.firestoreId}/player`}
                  >
                    <Play className='h-3 w-3' />
                  </LocalsLink>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>View in Player</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
}

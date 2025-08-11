// src/components/admin/UserUploadsListItem.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Play, Download } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Song } from '@/lib/songs';
import LocalsLink from '../ui/LocalsLink';

interface UserUploadsListItemProps {
  song: Song;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export default function UserUploadsListItem({
  song,
}: UserUploadsListItemProps) {
  return (
    <TableRow className='hover:bg-muted/50'>
      <TableCell className='font-medium max-w-0'>
        <LocalsLink
          href={`/lyrics/${song.id}`}
          className='hover:underline text-blue-600 hover:text-blue-800 block truncate'
          title={song.title}
        >
          {song.title}
        </LocalsLink>
      </TableCell>
      <TableCell className='hidden md:table-cell max-w-0'>
        <div className='truncate' title={song.artist}>
          {song.artist}
        </div>
      </TableCell>
      <TableCell className='hidden lg:table-cell'>
        <Badge variant='outline' className='text-xs'>
          {song.originalKey || 'N/A'}
        </Badge>
      </TableCell>
      <TableCell className='hidden lg:table-cell max-w-0'>
        <div
          className='truncate'
          title={song.uploaderName || song.uploaderEmail || 'Unknown'}
        >
          {song.uploaderName || song.uploaderEmail || 'Unknown'}
        </div>
      </TableCell>
      <TableCell className='hidden xl:table-cell text-sm text-muted-foreground'>
        {formatDate(song.updatedAt)}
      </TableCell>
      <TableCell className='text-right'>
        <div className='flex items-center gap-1 justify-end'>
          <div className='flex items-center gap-1 text-xs text-muted-foreground mr-2'>
            <Download className='h-3 w-3' />
            <span>{song.downloadCount || 0}</span>
          </div>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant='ghost' size='sm'>
                  <LocalsLink href={`/lyrics/${song.id}/player`}>
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

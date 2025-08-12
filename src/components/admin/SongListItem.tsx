// src/components/admin/SongListItem.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Play } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
import { Timestamp } from 'firebase/firestore';

interface SongListItemProps {
  song: Song;
  onDelete: (song: Song) => void;
}

function formatDate(date?: number): string {
  if (!date) return 'N/A';
  return new Date(date).toLocaleString('th-TH', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getSourceBadge(source: string) {
  const variants = {
    system: 'default',
    user: 'secondary',
    saved: 'outline',
  } as const;

  return (
    <Badge variant={variants[source as keyof typeof variants] || 'outline'}>
      {source === 'system' ? 'System' : source === 'user' ? 'User' : 'Saved'}
    </Badge>
  );
}

export default function SongListItem({ song, onDelete }: SongListItemProps) {
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
      <TableCell className='hidden lg:table-cell'>
        {getSourceBadge(song.source || 'saved')}
      </TableCell>
      <TableCell className='hidden xl:table-cell text-sm text-muted-foreground'>
        {formatDate(song?.updatedAt)}
      </TableCell>
      <TableCell className='text-right'>
        <div className='flex items-center gap-1 justify-end'>
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

            <Tooltip>
              <TooltipTrigger asChild>
                <Button asChild variant='ghost' size='sm'>
                  <LocalsLink href={`/song-editor?mode=cloud&id=${song.id}`}>
                    <Edit className='h-3 w-3' />
                  </LocalsLink>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant='ghost'
                      size='sm'
                      className='text-destructive hover:text-destructive'
                    >
                      <Trash2 className='h-3 w-3' />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete &quot;{song.title}&quot;
                        from the cloud. This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => onDelete(song)}
                        className='bg-destructive hover:bg-destructive/90'
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </TableCell>
    </TableRow>
  );
}

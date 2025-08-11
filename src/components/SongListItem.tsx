// src/components/SongListItem.tsx
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Edit, Trash2, Eye } from 'lucide-react';
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
import type { Song } from '@/lib/songs';
import LocalsLink from './ui/LocalsLink';

interface SongListItemProps {
  song: Song;
  onDelete: (song: Song) => void;
}

export default function SongListItem({ song, onDelete }: SongListItemProps) {
  return (
    <li className='flex items-center p-3 rounded-lg bg-muted/50 transition-colors hover:bg-muted/80 group'>
      <div className='flex-grow'>
        <LocalsLink
          href={`/lyrics/${song.id}`}
          className='font-semibold hover:underline'
        >
          {song.title}
        </LocalsLink>
        <p className='text-sm text-muted-foreground'>{song.artist}</p>
      </div>
      <div className='flex items-center gap-1'>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant='ghost' size='icon'>
                <LocalsLink href={`/lyrics/${song.id}/player`}>
                  <Eye className='h-4 w-4' />
                </LocalsLink>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>View in Player</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant='ghost' size='icon'>
                <LocalsLink href={`/song-editor?mode=cloud&id=${song.id}`}>
                  <Edit className='h-4 w-4' />
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
                    size='icon'
                    className='text-destructive hover:text-destructive'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete &quot;{song.title}&quot; from
                      the cloud. This action cannot be undone.
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
    </li>
  );
}

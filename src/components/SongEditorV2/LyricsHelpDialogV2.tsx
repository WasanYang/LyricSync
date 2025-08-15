// src/components/SongEditorV2/LyricsHelpDialogV2.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LyricsHelpDialogV2({ className }: { className?: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          type='button'
          variant='ghost'
          size='icon'
          className={cn('h-5 w-5', className, 'text-muted-foreground')}
        >
          <HelpCircle className='h-4 w-4' />
        </Button>
      </DialogTrigger>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader>
          <DialogTitle>How to Format Lyrics (New Simplified Version)</DialogTitle>
          <p className='text-sm text-muted-foreground'>
            Follow this simple format to ensure your song displays correctly.
          </p>
        </DialogHeader>
        <div className='space-y-4 text-sm py-4'>
          <p>
            The new system is much simpler. You only need to know three things: section headers, chords, and lyrics.
          </p>
          
          <div>
            <h4 className='font-semibold mb-2'>Key Concepts:</h4>
            <ul className='list-disc pl-5 space-y-2'>
              <li>
                <strong>Section Headers:</strong> To define sections like (Intro), (Verse), or (Chorus), just type them inside parentheses on their own line. For example: <code className='bg-muted px-1 py-0.5 rounded'>(Verse 1)</code>
              </li>
              <li>
                <strong>Chords:</strong> Enclose chords in square brackets, like <code className='bg-muted px-1 py-0.5 rounded'>[C]</code> or <code className='bg-muted px-1 py-0.5 rounded'>[G/B]</code>. Place the chord line directly above the lyric line it corresponds to.
              </li>
              <li>
                <strong>Lyrics:</strong> Just type the lyrics directly.
              </li>
              <li>
                <strong>Line Breaks:</strong> An empty line will create a visual space in the player, useful for separating parts of a verse or chorus.
              </li>
            </ul>
          </div>

          <div className='p-4 bg-muted rounded-md font-mono text-xs overflow-x-auto'>
            <p className='font-bold mb-2'>Example:</p>
            <pre className='whitespace-pre-wrap'>
{`(Verse 1)
[C]         [G]
Your lyric line here
[Am]        [F]
The next lyric line

(Chorus)
[F]         [C]
This is the chorus
[G]         [C]
It's very simple`}
            </pre>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

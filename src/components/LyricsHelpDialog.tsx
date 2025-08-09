// src/components/LyricsHelpDialog.tsx
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LyricsHelpDialog({ className }: { className?: string }) {
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
          <DialogTitle>How to Format Lyrics & Chords</DialogTitle>
          <p className='text-sm text-muted-foreground'>
            Follow this format to ensure your lyrics and chords display
            correctly in the player.
          </p>
        </DialogHeader>
        <div className='space-y-4 text-sm py-4'>
          <p>
            Each line must start with a number representing the number of
            measures (ห้อง), followed by a pipe `|`, and then the text content.
          </p>
          <div className='p-4 bg-muted rounded-md font-mono text-xs overflow-x-auto'>
            <p className='font-bold mb-2'>Format:</p>
            <p>
              <code className='text-primary'>num_of_measures</code> |{' '}
              <code className='text-primary'>[Chord]</code>Lyric text...
            </p>
          </div>

          <div>
            <h4 className='font-semibold mb-2'>Key Concepts:</h4>
            <ul className='list-disc pl-5 space-y-2'>
              <li>
                <strong>Number of Measures:</strong> Every line must begin with
                a number representing how many measures/bars that line of lyric
                should last.
              </li>
              <li>
                <strong>Line Duration:</strong> A line with `0` measures will
                be combined with the previous line and not advance the
                timeline. Use this for multi-line lyrics within the same set of
                measures.
              </li>
              <li>
                <strong>Pipe Separator:</strong> A pipe character `|` must
                follow the number to separate it from the content.
              </li>
              <li>
                <strong>Chords:</strong> Enclose chords in square brackets, like{' '}
                <code className='bg-muted px-1 py-0.5 rounded'>[C]</code> or{' '}
                <code className='bg-muted px-1 py-0.5 rounded'>[G/B]</code>.
                Place them right before the syllable where the chord change
                occurs.
              </li>
              <li>
                <strong>Section Headers:</strong> To define sections like
                (Intro), (Verse), or (Chorus), use `0` for the number of
                measures.
              </li>
              <li>
                <strong>Comments:</strong> To add a non-lyric comment (e.g.,
                instrumental cue, vocal instruction), start the line with a `*`
                character. These lines will be displayed in italics. The number
                of measures for comments will be ignored.
              </li>
            </ul>
          </div>

          <div className='p-4 bg-muted rounded-md font-mono text-xs overflow-x-auto'>
            <p className='font-bold mb-2'>Examples:</p>
            <p>0 | (Intro)</p>
            <p>4 | [Am] [G] [C] [F]</p>
            <p>4 | [C]This is a [G]line with chords.</p>
            <p>0 | * Instrumental break</p>
            <p>4 | This is a line with no chords.</p>
            <p>0 | (Verse 1)</p>
            <p>4 | The quick [Am]brown fox [G]jumps over the [C]lazy dog.[F]</p>
            <p>
              0 | This is the second line of lyrics for the 4 measures above.
            </p>
            <p>0 | * Sing softly</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

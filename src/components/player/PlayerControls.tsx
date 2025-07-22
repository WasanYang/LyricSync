// src/components/player/PlayerControls.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Play,
  Pause,
  Repeat,
  SkipBack,
  SkipForward,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayerControlsProps {
  isPlaying: boolean;
  isFinished: boolean;
  currentTime: number;
  totalDuration: number;
  currentLineIndex: number;
  processedLyricsLength: number;
  bpm: number;
  isSetlistMode?: boolean;
  onTogglePlay: () => void;
  onSliderChange: (value: number[]) => void;
  onPrevLine: () => void;
  onNextLine: () => void;
  onOpenSettings: () => void;
  formatTime: (seconds: number) => string;
}

export default function PlayerControls({
  isPlaying,
  isFinished,
  currentTime,
  totalDuration,
  currentLineIndex,
  processedLyricsLength,
  bpm,
  isSetlistMode = false,
  onTogglePlay,
  onSliderChange,
  onPrevLine,
  onNextLine,
  onOpenSettings,
  formatTime,
}: PlayerControlsProps) {
  return (
    <div
      className={cn(
        'fixed bottom-0 left-0 right-0 pointer-events-none',
        isSetlistMode && 'bottom-16'
      )}
    >
      <div className='bg-background/50 backdrop-blur-sm pointer-events-auto py-2'>
        <div className='max-w-4xl mx-auto space-y-2 px-4'>
          <div className='flex items-center gap-4'>
            <span className='text-xs font-mono w-10 text-center'>
              {formatTime(currentTime)}
            </span>
            <Slider
              value={[currentTime]}
              max={totalDuration}
              step={0.1}
              onValueChange={onSliderChange}
            />
            <span className='text-xs font-mono w-10 text-center'>
              {formatTime(totalDuration)}
            </span>
          </div>
          <div className='relative flex justify-center items-center w-full gap-4 h-12'>
            <div className='absolute left-0 top-1/2 -translate-y-1/2 flex items-center'>
              <span className='text-xs font-bold text-muted-foreground'>
                {bpm} BPM
              </span>
            </div>
            <Button
              variant='ghost'
              size='icon'
              onClick={onPrevLine}
              disabled={currentLineIndex <= 0}
            >
              <SkipBack />
            </Button>
            <Button
              variant='outline'
              size='icon'
              className='w-12 h-12 rounded-full'
              onClick={onTogglePlay}
            >
              {isFinished ? (
                <Repeat className='h-6 w-6' />
              ) : isPlaying ? (
                <Pause className='h-6 w-6' />
              ) : (
                <Play className='h-6 w-6' />
              )}
            </Button>
            <Button
              variant='ghost'
              size='icon'
              onClick={onNextLine}
              disabled={currentLineIndex >= processedLyricsLength - 1}
            >
              <SkipForward />
            </Button>
            <div className='absolute right-0 top-1/2 -translate-y-1/2 flex items-center'>
              <Button variant='ghost' size='icon' onClick={onOpenSettings}>
                <Settings />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

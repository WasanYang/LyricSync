// src/components/LyricPlayerV2/PlayerControlsV2.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, Minus, Plus } from 'lucide-react';

interface PlayerControlsV2Props {
  isPlaying: boolean;
  scrollSpeed: number;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
  onTranspose: (amount: number) => void;
}

export function PlayerControlsV2({
  isPlaying,
  scrollSpeed,
  onTogglePlay,
  onSpeedChange,
  onTranspose
}: PlayerControlsV2Props) {
  return (
    <div className='fixed bottom-0 left-0 right-0 z-10'>
      <div className='bg-background/80 backdrop-blur-sm pointer-events-auto border-t p-4'>
        <div className='max-w-4xl mx-auto flex items-center justify-between gap-4'>
          
          {/* Transpose Controls */}
          <div className='flex items-center gap-2'>
            <Button variant="outline" size="icon" onClick={() => onTranspose(-1)} className='h-10 w-10'>
              <Minus className='h-5 w-5' />
            </Button>
            <span className='font-bold w-12 text-center text-sm'>Key</span>
             <Button variant="outline" size="icon" onClick={() => onTranspose(1)} className='h-10 w-10'>
              <Plus className='h-5 w-5' />
            </Button>
          </div>

          {/* Play/Pause Button */}
          <Button variant='default' size='icon' className='w-14 h-14 rounded-full' onClick={onTogglePlay}>
            {isPlaying ? <Pause className='h-7 w-7' /> : <Play className='h-7 w-7' />}
          </Button>

          {/* Speed Controls */}
          <div className='flex items-center gap-2 flex-grow max-w-[150px]'>
             <Slider
              value={[scrollSpeed]}
              min={0.1}
              max={2}
              step={0.1}
              onValueChange={(value) => onSpeedChange(value[0])}
            />
            <span className='text-xs font-mono w-10 text-center'>{scrollSpeed.toFixed(1)}x</span>
          </div>

        </div>
      </div>
    </div>
  );
}

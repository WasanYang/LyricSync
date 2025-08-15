// src/components/LyricPlayerV2/SettingsSheetV2.tsx
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';
import { Minus, Plus, Check } from 'lucide-react';
import { useTheme } from 'next-themes';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Dispatch } from 'react';

const FONT_SIZES = {
  min: 12,
  max: 32,
  step: 2,
};

const CHORD_COLORS = [
  { name: 'Black', value: 'hsl(0 0% 0%)' },
  { name: 'White', value: 'hsl(0 0% 100%)' },
  { name: 'Red', value: 'hsl(0 72.2% 50.6%)' },
  { name: 'Blue', value: 'hsl(221.2 83.2% 53.3%)' },
  { name: 'Green', value: 'hsl(142.1 76.2% 36.3%)' },
  { name: 'Orange', value: 'hsl(24.6 95% 53.1%)' },
  { name: 'Violet', value: 'hsl(262.1 83.3% 57.8%)' },
];

interface SettingsSheetV2Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  fontSize: number;
  showChords: boolean;
  chordColor: string;
  showChordHighlights: boolean;
  dispatch: Dispatch<any>;
}

export function SettingsSheetV2({
  isOpen,
  onOpenChange,
  fontSize,
  showChords,
  chordColor,
  showChordHighlights,
  dispatch,
}: SettingsSheetV2Props) {
  const { theme, setTheme } = useTheme();

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className='w-full max-w-sm'>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <div className='py-4 space-y-6'>
          {/* General Settings */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <Label htmlFor='dark-mode-switch'>Dark Mode</Label>
              <Switch
                id='dark-mode-switch'
                checked={theme === 'dark'}
                onCheckedChange={(checked) =>
                  setTheme(checked ? 'dark' : 'light')
                }
              />
            </div>
            <div className='flex items-center justify-between'>
              <Label>Font Size</Label>
              <div className='flex items-center gap-2'>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-7 w-7'
                  onClick={() =>
                    dispatch({
                      type: 'SET_FONT_SIZE',
                      payload: Math.max(
                        FONT_SIZES.min,
                        fontSize - FONT_SIZES.step
                      ),
                    })
                  }
                >
                  <Minus className='h-4 w-4' />
                </Button>
                <span className='text-sm w-8 text-center'>{fontSize}</span>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-7 w-7'
                  onClick={() =>
                    dispatch({
                      type: 'SET_FONT_SIZE',
                      payload: Math.min(
                        FONT_SIZES.max,
                        fontSize + FONT_SIZES.step
                      ),
                    })
                  }
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </div>
          <Separator />
          {/* Chords Settings */}
          <div className='space-y-4'>
            <SheetDescription>Chords</SheetDescription>
            <div className='flex items-center justify-between'>
              <Label htmlFor='show-chords-switch'>Show Chords</Label>
              <Switch
                id='show-chords-switch'
                checked={showChords}
                onCheckedChange={() => dispatch({ type: 'TOGGLE_CHORDS' })}
              />
            </div>
            <div className='flex items-center justify-between'>
              <Label htmlFor='highlight-chords-switch'>Highlight Chords</Label>
              <Switch
                id='highlight-chords-switch'
                checked={showChordHighlights}
                onCheckedChange={() =>
                  dispatch({ type: 'TOGGLE_CHORD_HIGHLIGHTS' })
                }
              />
            </div>
            <div className='flex items-center justify-between'>
              <Label>Chord Color</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant='outline' className='h-8'>
                    <div
                      className='w-4 h-4 rounded-full mr-2 border'
                      style={{ backgroundColor: chordColor }}
                    />
                    {CHORD_COLORS.find((c) => c.value === chordColor)?.name ||
                      'Custom'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='p-2 w-40'>
                  <div className='grid gap-1'>
                    {CHORD_COLORS.map((color) => (
                      <Button
                        key={color.name}
                        variant='ghost'
                        className='justify-start h-8 px-2'
                        onClick={() =>
                          dispatch({
                            type: 'SET_CHORD_COLOR',
                            payload: color.value,
                          })
                        }
                      >
                        <div
                          className='w-4 h-4 rounded-full mr-2 border'
                          style={{ backgroundColor: color.value }}
                        />
                        {color.name}
                        {chordColor === color.value && (
                          <Check className='h-4 w-4 ml-auto' />
                        )}
                      </Button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          <Separator />
          <Button
            variant='outline'
            className='w-full'
            onClick={() => dispatch({ type: 'RESET' })}
          >
            Reset to Defaults
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

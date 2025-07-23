// src/components/player/SettingsSheet.tsx
'use client';

import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Minus, Plus, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_NOTES } from '@/lib/chords';

type HighlightMode = 'line' | 'section' | 'none';
type FontWeight = 400 | 600 | 700;

interface SettingsSheetProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  showChords: boolean;
  currentKey: string;
  fontSize: number;
  highlightMode: HighlightMode;
  showSectionNavigator: boolean;
  showKeyControls: boolean;
  showFloatingControls?: boolean;
  showFloatingNavigator?: boolean;
  theme: 'light' | 'dark';
  bpm: number;
  onToggleChords: () => void;
  onTransposeDown: () => void;
  onTransposeUp: () => void;
  onKeyChange: (key: string) => void;
  onFontSizeChange: (amount: number) => void;
  onHighlightModeChange: (mode: HighlightMode) => void;
  onToggleSectionNavigator: () => void;
  onToggleKeyControls: () => void;
  onToggleFloatingControls?: () => void;
  onToggleFloatingNavigator?: () => void;
  onToggleTheme: () => void;
  onBpmChange: (bpm: number) => void;
  onResetSettings: () => void;
}

const HIGHLIGHT_OPTIONS: { value: HighlightMode; label: string }[] = [
  { value: 'line', label: 'Line' },
  { value: 'section', label: 'Section' },
  { value: 'none', label: 'None' },
];

export default function SettingsSheet({
  isOpen,
  onOpenChange,
  showChords,
  currentKey,
  fontSize,
  highlightMode,
  showSectionNavigator,
  showKeyControls,
  showFloatingControls,
  showFloatingNavigator,
  theme,
  bpm,
  onToggleChords,
  onTransposeDown,
  onTransposeUp,
  onKeyChange,
  onFontSizeChange,
  onHighlightModeChange,
  onToggleSectionNavigator,
  onToggleKeyControls,
  onToggleFloatingControls,
  onToggleFloatingNavigator,
  onToggleTheme,
  onBpmChange,
  onResetSettings,
}: SettingsSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side='right'
        className='p-0 flex flex-col max-h-screen w-full max-w-xs'
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        <SheetHeader className='p-4 border-b'>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <ScrollArea className='flex-grow'>
          <div className='p-4 space-y-6'>
            {/* Chords Settings */}
            <div className='space-y-4'>
              <Label className='text-base font-semibold'>Chords</Label>
              <div className='flex items-center justify-between'>
                <Label
                  htmlFor='show-chords-settings'
                  className='cursor-pointer'
                >
                  Show Chords
                </Label>
                <Switch
                  id='show-chords-settings'
                  checked={showChords}
                  onCheckedChange={onToggleChords}
                />
              </div>
              <div className='flex items-center justify-between'>
                <Label>Key</Label>
                <div className='flex items-center gap-1'>
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-7 w-7'
                    onClick={onTransposeDown}
                  >
                    <Minus className='h-4 w-4' />
                  </Button>
                  <Select value={currentKey} onValueChange={onKeyChange}>
                    <SelectTrigger className='w-[80px] h-7 text-xs'>
                      <SelectValue placeholder='Key' />
                    </SelectTrigger>
                    <SelectContent align='start'>
                      {ALL_NOTES.map((note) => (
                        <SelectItem key={note} value={note} className='text-xs'>
                          {note}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-7 w-7'
                    onClick={onTransposeUp}
                  >
                    <Plus className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </div>

            <Separator />

            {/* Display Settings */}
            <div className='space-y-4'>
              <Label className='text-base font-semibold'>Display</Label>
              <div className='flex items-center justify-between'>
                <Label>Font Size</Label>
                <div className='flex items-center gap-1'>
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-7 w-7'
                    onClick={() => onFontSizeChange(-2)}
                    disabled={fontSize <= 16}
                  >
                    <Minus className='h-4 w-4' />
                  </Button>
                  <span className='w-10 text-center text-sm font-mono'>
                    {fontSize}px
                  </span>
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-7 w-7'
                    onClick={() => onFontSizeChange(2)}
                    disabled={fontSize >= 48}
                  >
                    <Plus className='h-4 w-4' />
                  </Button>
                </div>
              </div>
              <div className='flex items-center justify-between'>
                <Label>Highlight</Label>
                <RadioGroup
                  value={highlightMode}
                  onValueChange={onHighlightModeChange}
                  className='flex items-center gap-1'
                >
                  {HIGHLIGHT_OPTIONS.map((option) => (
                    <Label
                      key={option.value}
                      className={cn(
                        'flex h-7 w-14 items-center justify-center cursor-pointer rounded-md border text-xs opacity-75 hover:bg-accent hover:text-accent-foreground',
                        highlightMode === option.value &&
                          'border-primary bg-primary/10 text-primary opacity-100'
                      )}
                    >
                      <RadioGroupItem
                        value={option.value}
                        id={`highlight-${option.value}`}
                        className='sr-only'
                      />
                      {option.label}
                    </Label>
                  ))}
                </RadioGroup>
              </div>
              {/* <div className='flex items-center justify-between'>
                <Label htmlFor='show-section-nav'>Navigator</Label>
                <Switch
                  id='show-section-nav'
                  checked={showSectionNavigator}
                  onCheckedChange={onToggleSectionNavigator}
                />
              </div> */}
              {/* <div className='flex items-center justify-between'>
                <Label htmlFor='show-key-controls'>Quick Controls</Label>
                <Switch
                  id='show-key-controls'
                  checked={showKeyControls}
                  onCheckedChange={onToggleKeyControls}
                />
              </div> */}
              {onToggleFloatingControls && (
                <div className='flex items-center justify-between'>
                  <Label htmlFor='show-floating-controls'>
                    Floating Controls
                  </Label>
                  <Switch
                    id='show-floating-controls'
                    checked={showFloatingControls}
                    onCheckedChange={onToggleFloatingControls}
                  />
                </div>
              )}
              {onToggleFloatingNavigator && (
                <div className='flex items-center justify-between'>
                  <Label htmlFor='show-floating-navigator'>
                    Floating Navigator
                  </Label>
                  <Switch
                    id='show-floating-navigator'
                    checked={showFloatingNavigator}
                    onCheckedChange={onToggleFloatingNavigator}
                  />
                </div>
              )}
              <div className='flex items-center justify-between'>
                <Label htmlFor='dark-mode'>Theme</Label>
                <Switch
                  id='dark-mode'
                  checked={theme === 'dark'}
                  onCheckedChange={onToggleTheme}
                />
              </div>
            </div>

            <Separator />

            {/* Other Settings */}
            <div className='space-y-4'>
              <Label className='text-base font-semibold'>Playback</Label>
              <div className='flex items-center justify-between'>
                <Label>BPM</Label>
                <div className='flex items-center gap-1'>
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-7 w-7'
                    onClick={() => onBpmChange(bpm - 5)}
                  >
                    <Minus className='h-4 w-4' />
                  </Button>
                  <Input
                    type='number'
                    className='w-16 h-7 text-center'
                    value={bpm}
                    onChange={(e) =>
                      onBpmChange(parseInt(e.target.value, 10) || bpm)
                    }
                  />
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-7 w-7'
                    onClick={() => onBpmChange(bpm + 5)}
                  >
                    <Plus className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
        <div className='p-4 border-t'>
          <Button
            variant='outline'
            className='w-full'
            onClick={onResetSettings}
          >
            <RotateCcw className='mr-2 h-4 w-4' /> Reset All Settings
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

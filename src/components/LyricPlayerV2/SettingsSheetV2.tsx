// src/components/LyricPlayerV2/SettingsSheetV2.tsx
'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Separator } from '../ui/separator';
import { Label } from '../ui/label';
import { Switch } from '../ui/switch';
import { Button } from '../ui/button';

interface SettingsSheetV2Props {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  // Add other props for settings as they are implemented
}

export function SettingsSheetV2({
  isOpen,
  onOpenChange,
}: SettingsSheetV2Props) {
  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Settings</SheetTitle>
        </SheetHeader>
        <div className='py-4 space-y-4'>
          <div className='flex items-center justify-between'>
            <Label htmlFor='dark-mode-switch'>Dark Mode</Label>
            <Switch id='dark-mode-switch' />
          </div>
          <Separator />
          {/* Other settings will go here */}
          <p className='text-sm text-muted-foreground text-center'>
            More settings coming soon.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}

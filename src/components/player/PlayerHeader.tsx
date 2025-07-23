// src/components/player/PlayerHeader.tsx
'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PlayerHeaderProps {
  title: string;
  onClose?: () => void;
  isSetlistMode?: boolean;
}

export default function PlayerHeader({
  title,
  onClose,
  isSetlistMode = false,
}: PlayerHeaderProps) {
  const router = useRouter();

  if (isSetlistMode) {
    return null;
  }

  return (
    <header className='fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm pointer-events-auto'>
      <div className='relative container mx-auto flex items-center justify-between h-14'>
        <div className='absolute left-2 top-1/2 -translate-y-1/2'>
          {onClose ? (
            <Button variant='ghost' size='icon' onClick={onClose}>
              <ArrowLeft />
              <span className='sr-only'>Close Preview</span>
            </Button>
          ) : (
            <Button variant='ghost' size='icon' onClick={() => router.back()}>
              <ArrowLeft />
              <span className='sr-only'>Back</span>
            </Button>
          )}
        </div>

        <div className='flex-1 text-center min-w-0 px-12'>
          <h1 className='font-headline text-xl font-bold truncate'>{title}</h1>
        </div>

        <div className='absolute right-2 top-1/2 -translate-y-1/2 w-9'>
          {/* This space is now empty, settings are at the bottom */}
        </div>
      </div>
    </header>
  );
}

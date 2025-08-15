// src/components/LyricPlayerV2/PlayerHeaderV2.tsx
'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface PlayerHeaderV2Props {
  title: string;
  artist: string;
  onClose?: () => void;
}

export function PlayerHeaderV2({ title, artist, onClose }: PlayerHeaderV2Props) {
  const router = useRouter();

  const handleBack = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  return (
    <header className='flex-shrink-0 z-10 bg-background/80 backdrop-blur-sm pointer-events-auto border-b'>
      <div className='relative container mx-auto flex items-center justify-between h-14'>
        <div className='absolute left-2 top-1/2 -translate-y-1/2'>
          <Button variant='ghost' size='icon' onClick={handleBack}>
            <ArrowLeft />
            <span className='sr-only'>Back</span>
          </Button>
        </div>

        <div className='flex-1 text-center min-w-0 px-12'>
          <h1 className='font-headline text-lg font-bold truncate'>{title}</h1>
          <p className='text-sm text-muted-foreground truncate'>{artist}</p>
        </div>
        
        <div className='w-9' />
      </div>
    </header>
  );
}


'use client';

import { Button } from '@/components/ui/button';
import { SkipBack, SkipForward } from 'lucide-react';

interface SetlistControlsProps {
  onNext: () => void;
  onPrev: () => void;
  isNextDisabled: boolean;
  isPrevDisabled: boolean;
}

export default function SetlistControls({
  onNext,
  onPrev,
  isNextDisabled,
  isPrevDisabled,
}: SetlistControlsProps) {

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-auto bg-background/50 backdrop-blur-sm shadow-[0_-1px_8px_rgba(0,0,0,0.1)] dark:shadow-[0_-1px_8px_rgba(0,0,0,0.4)]">
        <div className="h-[60px] container mx-auto max-w-sm">
            <div className="flex items-center justify-between h-full bg-transparent rounded-lg">
            <Button variant="ghost" size="icon" onClick={onPrev} disabled={isPrevDisabled} className="h-10 w-10">
                <SkipBack />
                <span className="sr-only">Previous Song</span>
            </Button>
            
            <Button variant="ghost" size="icon" onClick={onNext} disabled={isNextDisabled} className="h-10 w-10">
                <SkipForward />
                 <span className="sr-only">Next Song</span>
            </Button>
            </div>
        </div>
    </div>
  );
}


'use client';

import { Button } from '@/components/ui/button';
import { SkipBack, SkipForward } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SetlistControlsProps {
    onNextSong?: () => void;
    onPrevSong?: () => void;
    isNextDisabled?: boolean;
    isPrevDisabled?: boolean;
}

export default function SetlistControls({
    onNextSong,
    onPrevSong,
    isNextDisabled,
    isPrevDisabled
}: SetlistControlsProps) {
    return (
        <div className="fixed bottom-0 left-0 right-0 z-10">
            <div className={cn("bg-background/50 backdrop-blur-sm pointer-events-auto")}>
                <div className="max-w-4xl mx-auto flex justify-between items-center w-full h-16 px-0">
                    <Button variant="ghost" size="icon" className="w-1/2 h-full rounded-none" onClick={onPrevSong} disabled={isPrevDisabled} aria-label="Previous Song">
                        <SkipBack />
                    </Button>
                    <div className="w-px h-8 bg-border"></div>
                    <Button variant="ghost" size="icon" className="w-1/2 h-full rounded-none" onClick={onNextSong} disabled={isNextDisabled} aria-label="Next Song">
                        <SkipForward />
                    </Button>
                </div>
            </div>
        </div>
    )
}


'use client';

import type { Song } from '@/lib/songs';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";
import { ScrollArea } from '@/components/ui/scroll-area';
import { SkipBack, SkipForward, ListMusic, Music } from 'lucide-react';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { useState } from 'react';

interface SetlistControlsProps {
  songs: Song[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onSelectSong: (index: number) => void;
  onToggleQueue?: () => void;
}

export default function SetlistControls({
  songs,
  currentIndex,
  onNext,
  onPrev,
  onSelectSong,
  onToggleQueue,
}: SetlistControlsProps) {
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-auto bg-background/80 backdrop-blur-sm shadow-[0_-1px_8px_rgba(0,0,0,0.1)] dark:shadow-[0_-1px_8px_rgba(0,0,0,0.4)]">
        <div className="h-[60px] p-2 container mx-auto max-w-4xl">
            <div className="flex items-center justify-between h-full bg-transparent rounded-lg px-4">
            <Button variant="ghost" size="icon" onClick={onPrev} disabled={currentIndex === 0} className="h-10 w-10">
                <SkipBack />
            </Button>
            
            <div className="flex items-center gap-2">
                {/* Mobile Queue Sheet */}
                <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                    <SheetTrigger asChild>
                        <Button variant="ghost" size="icon" className="md:hidden h-10 w-10">
                            <ListMusic />
                        </Button>
                    </SheetTrigger>
                    <SheetContent side="bottom" className="p-0 flex flex-col max-h-[60vh] rounded-t-lg bg-background">
                        <SheetHeader className="p-4 border-b">
                            <SheetTitle className="text-center">Up Next</SheetTitle>
                        </SheetHeader>
                        <ScrollArea className="flex-grow">
                            <div className="p-2">
                                {songs.map((song, index) => (
                                  <SheetClose asChild key={`${song.id}-${index}`}>
                                    <button
                                        onClick={() => onSelectSong(index)}
                                        className={cn(
                                            "w-full flex items-center gap-4 p-3 rounded-lg text-left transition-colors",
                                            currentIndex === index ? "bg-primary/10" : "hover:bg-accent",
                                            index < currentIndex && "opacity-50"
                                        )}
                                    >
                                        <div className="flex-shrink-0 w-8 text-center">
                                            {currentIndex === index ? (
                                                <Music className="h-5 w-5 mx-auto text-primary" />
                                            ) : (
                                                <span className="font-mono text-muted-foreground">{index + 1}</span>
                                            )}
                                        </div>
                                         <Image
                                            src={`https://placehold.co/80x80.png?text=${encodeURIComponent(song.title)}`}
                                            alt={`${song.title} album art`}
                                            width={40}
                                            height={40}
                                            className="rounded-md aspect-square object-cover"
                                            data-ai-hint="album cover"
                                         />
                                        <div>
                                            <p className={cn("font-semibold", currentIndex === index && "text-primary")}>{song.title}</p>
                                            <p className="text-sm text-muted-foreground">{song.artist}</p>
                                        </div>
                                    </button>
                                   </SheetClose>
                                ))}
                            </div>
                        </ScrollArea>
                    </SheetContent>
                </Sheet>
                {/* Desktop Queue Toggle */}
                {onToggleQueue && (
                  <Button variant="ghost" size="icon" className="hidden md:inline-flex h-10 w-10" onClick={onToggleQueue}>
                    <ListMusic />
                  </Button>
                )}
            </div>

            <Button variant="ghost" size="icon" onClick={onNext} disabled={currentIndex === songs.length - 1} className="h-10 w-10">
                <SkipForward />
            </Button>
            </div>
        </div>
    </div>
  );
}

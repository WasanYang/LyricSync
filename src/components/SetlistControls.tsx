
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
import { SkipBack, SkipForward, ListMusic, Music, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';

interface SetlistControlsProps {
  setlistTitle: string;
  songs: Song[];
  currentIndex: number;
  onNext: () => void;
  onPrev: () => void;
  onSelectSong: (index: number) => void;
  onToggleQueue?: () => void;
}

export default function SetlistControls({
  setlistTitle,
  songs,
  currentIndex,
  onNext,
  onPrev,
  onSelectSong,
  onToggleQueue,
}: SetlistControlsProps) {
  const currentSong = songs[currentIndex];
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 pointer-events-auto md:pointer-events-none">
        <div className="bg-background/80 backdrop-blur-sm shadow-[0_-1px_8px_rgba(0,0,0,0.1)] dark:shadow-[0_-1px_8px_rgba(0,0,0,0.4)] pointer-events-auto">
            <header className="relative container mx-auto flex items-center justify-between h-14 max-w-4xl">
                <div className="flex-1 flex justify-start">
                    <Button asChild variant="ghost" size="icon">
                    <Link href="/setlists">
                        <ArrowLeft />
                        <span className="sr-only">Back to Setlists</span>
                    </Link>
                    </Button>
                </div>
                <div className="flex-1 text-center min-w-0">
                    <h1 className="font-headline text-lg font-bold truncate">{setlistTitle}</h1>
                </div>
                <div className="flex-1 flex justify-end items-center gap-0">
                  {/* Placeholder for future actions */}
                </div>
            </header>
            <div className="h-[72px] xl:h-20 p-2 container mx-auto max-w-4xl">
                <div className="flex items-center justify-between h-full bg-muted/50 rounded-lg px-4">
                <Button variant="ghost" size="icon" onClick={onPrev} disabled={currentIndex === 0}>
                    <SkipBack />
                </Button>

                <div className="text-center flex-grow min-w-0 px-4">
                    <p className="font-bold font-headline truncate">{currentSong.title}</p>
                    <p className="text-sm text-muted-foreground truncate">{currentSong.artist}</p>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={onNext} disabled={currentIndex === songs.length - 1}>
                        <SkipForward />
                    </Button>
                    {/* Mobile Queue Sheet */}
                    <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="md:hidden">
                                <ListMusic />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="bottom" className="p-0 flex flex-col max-h-[60vh] rounded-t-lg bg-background">
                            <SheetHeader className="p-4 border-b">
                                <SheetTitle className="text-center">{setlistTitle}</SheetTitle>
                            </SheetHeader>
                            <ScrollArea className="flex-grow">
                                <div className="p-2">
                                    {songs.map((song, index) => (
                                      <SheetClose asChild key={`${song.id}-${index}`}>
                                        <button
                                            onClick={() => onSelectSong(index)}
                                            className={cn(
                                                "w-full flex items-center gap-4 p-3 rounded-lg text-left transition-colors",
                                                currentIndex === index ? "bg-primary/10" : "hover:bg-accent"
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
                      <Button variant="ghost" size="icon" className="hidden md:inline-flex" onClick={onToggleQueue}>
                        <ListMusic />
                      </Button>
                    )}
                </div>
                </div>
            </div>
        </div>
    </div>
  );
}

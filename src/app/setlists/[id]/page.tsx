
'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, notFound } from 'next/navigation';
import type { Setlist } from '@/lib/db';
import type { Song } from '@/lib/songs';
import { getSetlist as getSetlistFromDb } from '@/lib/db';
import { getSongById } from '@/lib/songs';

import LyricPlayer from '@/components/LyricPlayer';
import SetlistControls from '@/components/SetlistControls';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { Music, Move, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

function LoadingSkeleton() {
    return (
        <div className="flex bg-background h-screen overflow-hidden">
            <div className="flex-grow p-4 pt-20">
                <div className="space-y-4 max-w-lg mx-auto w-full">
                    <Skeleton className="h-8 w-3/4 mx-auto" />
                    <Skeleton className="h-4 w-1/2 mx-auto" />
                    <div className="pt-12 space-y-6">
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-5/6" />
                        <Skeleton className="h-6 w-full" />
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-6 w-5/6" />
                    </div>
                </div>
            </div>
            <div className="hidden md:block w-80 border-l p-4 space-y-4">
                 <Skeleton className="h-10 w-full" />
                 <Skeleton className="h-16 w-full" />
                 <Skeleton className="h-16 w-full opacity-60" />
                 <Skeleton className="h-16 w-full opacity-40" />
            </div>
             <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80">
                 <Skeleton className="h-24 w-full max-w-full mx-auto rounded-lg" />
            </div>
        </div>
    )
}

function QueueItem({ song, index, isActive, isPlayed, onSelect }: { song: Song, index: number, isActive: boolean, isPlayed: boolean, onSelect: (index: number) => void }) {
    return (
        <button
            onClick={() => onSelect(index)}
            className={cn(
                "w-full flex items-center gap-4 p-3 rounded-lg text-left transition-all duration-200",
                isActive && "bg-primary/10",
                !isActive && !isPlayed && "hover:bg-accent",
                isPlayed && "opacity-50 hover:opacity-75"
            )}
        >
            <div className="flex-shrink-0 w-8 text-center">
                {isActive ? (
                    <Music className="h-5 w-5 mx-auto text-primary animate-pulse" />
                ) : (
                    <span className="font-mono text-muted-foreground">{index + 1}</span>
                )}
            </div>
             <Image
                src={`https://placehold.co/80x80.png?text=${encodeURIComponent(song.title)}`}
                alt={`${song.title} album art`}
                width={48}
                height={48}
                className="rounded-md aspect-square object-cover"
                data-ai-hint="album cover"
             />
            <div className="min-w-0">
                <p className={cn("font-semibold truncate", isActive ? "text-primary" : "text-foreground")}>{song.title}</p>
                <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
            </div>
        </button>
    )
}

function FloatingQueue({
  setlist,
  songs,
  currentIndex,
  handleSelectSong,
  isVisible,
  onClose
}: {
  setlist: Setlist;
  songs: Song[];
  currentIndex: number;
  handleSelectSong: (index: number) => void;
  isVisible: boolean;
  onClose: () => void;
}) {
  const queueRef = React.useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    // Center the panel initially on desktop
    const screenWidth = window.innerWidth;
    const panelWidth = 350; // Corresponds to w-[350px]
    setPosition({ x: screenWidth - panelWidth - 20, y: 60 });
  }, []);

  const handleDragMouseDown = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    if (queueRef.current) {
      setIsDragging(true);
      const rect = queueRef.current.getBoundingClientRect();
      setDragOffset({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      e.preventDefault();
    }
  }, []);

  const handleDragMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setPosition({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
    }
  }, [isDragging, dragOffset]);

  const handleDragMouseUp = useCallback(() => setIsDragging(false), []);
  
  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleDragMouseMove);
      window.addEventListener('mouseup', handleDragMouseUp);
    } else {
      window.removeEventListener('mousemove', handleDragMouseMove);
      window.removeEventListener('mouseup', handleDragMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleDragMouseMove);
      window.removeEventListener('mouseup', handleDragMouseUp);
    };
  }, [isDragging, handleDragMouseMove, handleDragMouseUp]);

  if (!isVisible) return null;

  return (
    <div
      ref={queueRef}
      className="fixed z-20 hidden md:flex flex-col w-[350px] h-[70vh] max-h-[600px] rounded-xl border bg-background/80 backdrop-blur-sm shadow-2xl"
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
    >
      <div className="p-4 border-b flex items-center justify-between">
        <div>
            <h2 className="text-lg font-headline font-semibold truncate">Up Next</h2>
            <p className="text-sm text-muted-foreground">From: {setlist.title}</p>
        </div>
        <div className="flex items-center gap-1">
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 cursor-grab active:cursor-grabbing text-muted-foreground"
                onMouseDown={handleDragMouseDown}
                aria-label="Drag queue"
            >
                <Move className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground"
                onClick={onClose}
                aria-label="Close queue"
            >
                <X className="h-4 w-4" />
            </Button>
        </div>
      </div>
      <ScrollArea className="flex-grow">
           <div className="p-2 space-y-1">
              {songs.map((song, index) => (
                  <QueueItem 
                      key={`${song.id}-${index}`}
                      song={song}
                      index={index}
                      isActive={index === currentIndex}
                      isPlayed={index < currentIndex}
                      onSelect={handleSelectSong}
                  />
              ))}
          </div>
      </ScrollArea>
    </div>
  );
}


export default function SetlistPlayerPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    
    const [setlist, setSetlist] = useState<Setlist | null>(null);
    const [songs, setSongs] = useState<Song[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isQueueVisible, setIsQueueVisible] = useState(true);

    useEffect(() => {
        async function loadSetlist() {
            if (!id) return;
            try {
                setIsLoading(true);
                const loadedSetlist = await getSetlistFromDb(id);
                if (loadedSetlist) {
                    setSetlist(loadedSetlist);
                    const loadedSongs = loadedSetlist.songIds.map(songId => getSongById(songId)).filter(Boolean) as Song[];
                    setSongs(loadedSongs);
                } else {
                    notFound();
                }
            } catch (err) {
                console.error("Failed to load setlist", err);
                notFound();
            } finally {
                setIsLoading(false);
            }
        }
        loadSetlist();
    }, [id]);

    const handleNextSong = useCallback(() => {
        setCurrentIndex(prev => (prev + 1 < songs.length ? prev + 1 : prev));
    }, [songs.length]);

    const handlePrevSong = useCallback(() => {
        setCurrentIndex(prev => (prev - 1 >= 0 ? prev - 1 : prev));
    }, []);

    const handleSelectSong = useCallback((index: number) => {
        if(index >= 0 && index < songs.length) {
            setCurrentIndex(index);
        }
    }, [songs.length]);
    
    const toggleQueueVisibility = useCallback(() => {
        setIsQueueVisible(prev => !prev);
    }, []);

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!setlist || songs.length === 0) {
        return notFound();
    }
    
    const currentSong = songs[currentIndex];

    return (
      <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
        {/* Main Lyric Player Area */}
        <div className="flex-grow relative h-full">
            <LyricPlayer 
                song={currentSong} 
                isSetlistMode={true}
                onNextSong={handleNextSong}
            />
        </div>
        
        {/* Floating Queue for Desktop */}
        <FloatingQueue
            setlist={setlist}
            songs={songs}
            currentIndex={currentIndex}
            handleSelectSong={handleSelectSong}
            isVisible={isQueueVisible}
            onClose={() => setIsQueueVisible(false)}
        />
        
        {/* Unified Control Bar for both mobile and desktop */}
        <SetlistControls
            setlistTitle={setlist.title}
            songs={songs}
            currentIndex={currentIndex}
            onNext={handleNextSong}
            onPrev={handlePrevSong}
            onSelectSong={handleSelectSong}
            onToggleQueue={toggleQueueVisibility}
        />
      </div>
    );
}


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
import { Music } from 'lucide-react';

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


export default function SetlistPlayerPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    
    const [setlist, setSetlist] = useState<Setlist | null>(null);
    const [songs, setSongs] = useState<Song[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const queueItemRefs = useMemo(() => Array(songs.length).fill(0).map(() => React.createRef<HTMLDivElement>()), [songs.length]);

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

    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!setlist || songs.length === 0) {
        return notFound();
    }
    
    const currentSong = songs[currentIndex];

    return (
      <div className="h-screen w-full flex flex-col md:flex-row bg-background overflow-hidden">
        {/* Main Lyric Player Area */}
        <div className="flex-grow relative h-full">
            <LyricPlayer 
                song={currentSong} 
                isSetlistMode={true}
                onNextSong={handleNextSong}
            />
        </div>
        
        {/* Desktop Queue Sidebar */}
        <aside className="hidden md:flex flex-col w-[350px] xl:w-[400px] border-l bg-muted/30 h-full">
            <div className="p-4 border-b">
                <h2 className="text-lg font-headline font-semibold truncate">Up Next</h2>
                <p className="text-sm text-muted-foreground">From: {setlist.title}</p>
            </div>
            <ScrollArea className="flex-grow">
                 <div className="p-2 space-y-1">
                    {songs.map((song, index) => (
                        <QueueItem 
                            key={song.id}
                            song={song}
                            index={index}
                            isActive={index === currentIndex}
                            isPlayed={index < currentIndex}
                            onSelect={handleSelectSong}
                        />
                    ))}
                </div>
            </ScrollArea>
        </aside>

        {/* Unified Control Bar for both mobile and desktop */}
        <SetlistControls
            setlistTitle={setlist.title}
            songs={songs}
            currentIndex={currentIndex}
            onNext={handleNextSong}
            onPrev={handlePrevSong}
            onSelectSong={handleSelectSong}
        />
      </div>
    );
}

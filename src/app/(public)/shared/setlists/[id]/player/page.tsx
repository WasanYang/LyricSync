
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import type { Setlist } from '@/lib/db';
import type { Song } from '@/lib/songs';
import { getSetlistByFirestoreId, getCloudSongById } from '@/lib/db';
import { ALL_NOTES } from '@/lib/chords';

import LyricPlayer from '@/components/LyricPlayer';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import SetlistControls from '@/components/SetlistControls';

const ORIGINAL_SONG_KEY_NOTE = 'A'; // This should ideally be part of song data

function LoadingSkeleton() {
    return (
        <div className="flex flex-col bg-background h-screen overflow-hidden">
             <header className="fixed top-0 left-0 right-0 z-10 bg-background/80 backdrop-blur-sm border-b">
                 <div className="container mx-auto p-2 h-20 flex items-center justify-between">
                     <Skeleton className="h-8 w-24" />
                     <Skeleton className="h-8 w-8" />
                 </div>
             </header>
            <div className="flex-grow p-4 pt-28">
                <div className="space-y-4 max-w-lg mx-auto w-full">
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-5/6" />
                    <Skeleton className="h-6 w-full" />
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-6 w-5/6" />
                </div>
            </div>
             <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80">
                 <Skeleton className="h-12 w-full max-w-lg mx-auto rounded-lg" />
            </div>
        </div>
    )
}

const getTransposedKey = (transpose: number): string => {
    const originalKeyIndex = ALL_NOTES.indexOf(ORIGINAL_SONG_KEY_NOTE);
    if (originalKeyIndex === -1) return ORIGINAL_SONG_KEY_NOTE;
    const newKeyIndex = (originalKeyIndex + transpose + 12 * 10) % 12;
    return ALL_NOTES[newKeyIndex];
};


export default function SharedSetlistPlayerPage() {
    const params = useParams();
    const router = useRouter();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    
    const [setlist, setSetlist] = useState<Setlist | null>(null);
    const [songs, setSongs] = useState<Song[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [transpose, setTranspose] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const findSong = async (songId: string): Promise<Song | null> => {
        // For shared player, always get from cloud
        const song = await getCloudSongById(songId);
        return song;
    }

    useEffect(() => {
        async function loadSetlist() {
            if (!id) return;
            try {
                setIsLoading(true);
                // For shared player, get setlist by Firestore ID
                const loadedSetlist = await getSetlistByFirestoreId(id);
                if (loadedSetlist) {
                    setSetlist(loadedSetlist);
                    const songPromises = loadedSetlist.songIds.map(findSong);
                    const loadedSongs = (await Promise.all(songPromises)).filter(Boolean) as Song[];
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
    
    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!setlist || songs.length === 0) {
        return notFound();
    }
    
    const currentSong = songs[currentIndex];
    const nextSong = currentIndex + 1 < songs.length ? songs[currentIndex + 1] : null;

    return (
      <div className="h-screen w-full flex flex-col bg-background overflow-hidden">
        <header className="fixed top-0 left-0 right-0 z-10 bg-background/90 backdrop-blur-sm border-b">
            <div className="container mx-auto px-4 h-[88px] flex flex-col justify-center">
                <div className="flex items-center justify-between w-full">
                     <div className="flex items-center gap-2 min-w-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -ml-2" onClick={() => router.back()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0 -ml-2" onClick={() => {
                          if (window.history.length > 1) {
                            router.back();
                          } else {
                            router.push('/');
                          }
                        }}>
                            <ArrowLeft className="h-5 w-5" />
                            <span className="sr-only">Back</span>
                        </Button>
                        <div className="min-w-0">
                            <h1 className="font-headline text-base sm:text-lg font-bold truncate leading-tight">{setlist.title}</h1>
                            <p className="text-xs sm:text-sm text-muted-foreground">{`Song ${currentIndex + 1} of ${songs.length}`}</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-1 sm:gap-2 pl-2 sm:pl-4 bg-muted/50 p-1 sm:p-2 rounded-lg">
                        <div className="min-w-0 flex-grow text-right">
                             <div className="flex items-center justify-end gap-2">
                                <div className="min-w-0">
                                    <p className="font-bold truncate leading-tight text-xs sm:text-sm max-w-[100px] sm:max-w-none">{nextSong ? nextSong.title : 'End of list'}</p>
                                    {nextSong && <p className="text-xs text-muted-foreground truncate sm:block">{nextSong.artist}</p>}
                                </div>
                                {nextSong && (
                                    <div className="flex-shrink-0 text-center">
                                        <p className="font-bold leading-tight text-xs sm:text-sm">({getTransposedKey(transpose)})</p>
                                    </div>
                                )}
                            </div>
                        </div>
                        <ChevronRight className={cn("h-5 w-5 text-muted-foreground flex-shrink-0", !nextSong && "opacity-0")}/>
                    </div>
                   
                </div>
                 <div className="w-full text-center mt-2">
                     <p className="text-sm font-semibold truncate">{currentSong.title}</p>
                 </div>
            </div>
        </header>

        <div className="flex-grow relative h-full pt-[88px] pb-32">
            <LyricPlayer 
                song={currentSong} 
                isSetlistMode={true}
                onNextSong={handleNextSong}
                onPrevSong={handlePrevSong}
                isNextDisabled={currentIndex >= songs.length - 1}
                isPrevDisabled={currentIndex <= 0}
            />
        </div>
        <SetlistControls
            onNextSong={handleNextSong}
            onPrevSong={handlePrevSong}
            isNextDisabled={currentIndex >= songs.length - 1}
            isPrevDisabled={currentIndex <= 0}
        />
      </div>
    );
}

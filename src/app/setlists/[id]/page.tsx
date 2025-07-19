
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, notFound } from 'next/navigation';
import type { Setlist } from '@/lib/db';
import type { Song } from '@/lib/songs';
import { getSetlist as getSetlistFromDb } from '@/lib/db';
import { getSongById } from '@/lib/songs';

import LyricPlayer from '@/components/LyricPlayer';
import SetlistControls from '@/components/SetlistControls';
import { Skeleton } from '@/components/ui/skeleton';

function LoadingSkeleton() {
    return (
        <div className="flex flex-col bg-background h-screen overflow-hidden p-4 pt-20">
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
             <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80">
                 <Skeleton className="h-16 w-full max-w-4xl mx-auto rounded-lg" />
            </div>
        </div>
    )
}

export default function SetlistPlayerPage() {
    const params = useParams();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    
    const [setlist, setSetlist] = useState<Setlist | null>(null);
    const [songs, setSongs] = useState<Song[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

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
        <div className="relative w-full min-h-screen bg-background">
            <LyricPlayer 
                song={currentSong} 
                isSetlistMode={true}
                onNextSong={handleNextSong}
            />
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

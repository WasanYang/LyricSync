
'use client';

import React, { useState, useEffect } from 'react';
import { useParams, notFound, useRouter } from 'next/navigation';
import type { Setlist } from '@/lib/db';
import type { Song } from '@/lib/songs';
import { getSetlist as getSetlistFromDb, getSong as getSongFromLocalDb, getCloudSongById } from '@/lib/db';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Edit, Play, Trash2, ArrowLeft } from 'lucide-react';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { deleteSetlist as deleteSetlistFromDb } from '@/lib/db';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';


function LoadingSkeleton() {
    return (
        <div className="space-y-8">
            <div className="space-y-3">
                <Skeleton className="h-10 w-3/4" />
                <Skeleton className="h-5 w-24" />
            </div>
             <div className="flex gap-4">
                <Skeleton className="h-11 w-40" />
                <Skeleton className="h-11 w-11" />
                <Skeleton className="h-11 w-11" />
            </div>
            <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
            </div>
        </div>
    )
}

function SongItem({ song }: { song: Song }) {
  return (
    <Link href={`/lyrics/${song.id}`} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-muted/50 transition-colors">
      <Image
        src={`https://placehold.co/80x80.png?text=${encodeURIComponent(song.title)}`}
        alt={`${song.title} album art`}
        width={48}
        height={48}
        className="rounded-md aspect-square object-cover"
        data-ai-hint="album cover"
      />
      <div className="flex-grow min-w-0">
        <p className="font-semibold font-headline truncate">{song.title}</p>
        <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
      </div>
      <div className="text-sm text-muted-foreground">
        Key: {song.originalKey || 'N/A'}
      </div>
    </Link>
  );
}

function SetlistDetailContent() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const id = Array.isArray(params.id) ? params.id[0] : params.id;
    
    const [setlist, setSetlist] = useState<Setlist | null>(null);
    const [songs, setSongs] = useState<Song[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const findSong = async (songId: string): Promise<Song | null> => {
        let song = await getSongFromLocalDb(songId);
        if (song) return song;

        song = await getCloudSongById(songId);
        return song;
    }

    useEffect(() => {
        async function loadSetlist() {
            if (!id || !user) return;
            try {
                setIsLoading(true);
                const loadedSetlist = await getSetlistFromDb(id);
                // Ensure the user viewing this local setlist is the owner
                if (loadedSetlist && loadedSetlist.userId === user.uid) {
                    setSetlist(loadedSetlist);
                    const songPromises = loadedSetlist.songIds.map(findSong);
                    const loadedSongs = (await Promise.all(songPromises)).filter(Boolean) as Song[];
                    setSongs(loadedSongs);
                } else {
                    toast({ title: "Not Found", description: "Setlist not found in your library.", variant: "destructive" });
                    router.replace('/setlists');
                }
            } catch (err) {
                console.error("Failed to load setlist", err);
                notFound();
            } finally {
                setIsLoading(false);
            }
        }
        loadSetlist();
    }, [id, user, router, toast]);

    const handleDelete = async () => {
        if (!user || !setlist) return;
        try {
            await deleteSetlistFromDb(setlist.id, user.uid);
            toast({
                title: "Setlist Deleted",
                description: `"${setlist.title}" has been removed.`
            });
            router.push('/setlists');
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not delete the setlist.",
                variant: "destructive"
            });
        }
    };
    
    if (isLoading) {
        return <LoadingSkeleton />;
    }

    if (!setlist) {
        return null; // Should be redirected, but as a fallback.
    }
    
    const isOwner = user && setlist.userId === user.uid;

    return (
      <div className="space-y-8">
        <div className="space-y-2 pt-8 text-center">
            <h1 className="text-4xl font-bold font-headline">{setlist.title}</h1>
            <p className="text-muted-foreground">{songs.length} {songs.length === 1 ? 'song' : 'songs'}</p>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
            <Button asChild size="lg">
                <Link href={`/setlists/${setlist.id}/player`}>
                    <Play className="mr-2 h-5 w-5" /> View in Player
                </Link>
            </Button>
            {isOwner && (
                <>
                    <Button asChild variant="outline" size="icon">
                        <Link href={`/setlists/edit/${setlist.id}`}>
                            <Edit className="h-5 w-5" />
                            <span className="sr-only">Edit Setlist</span>
                        </Link>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                                <Trash2 className="h-5 w-5" />
                                <span className="sr-only">Delete Setlist</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the setlist &quot;{setlist.title}&quot;.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </>
            )}
        </div>
        
        <div className="space-y-2">
            {songs.map((song) => (
                <SongItem key={song.id} song={song} />
            ))}
        </div>
      </div>
    );
}

export default function SetlistDetailPage() {
    const { user } = useAuth();
    return (
        <div className="flex-grow flex flex-col">
            {user && <Header />}
            <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8 relative">
                <Button asChild variant="ghost" size="icon" className="absolute top-4 left-4">
                    <Link href="/setlists">
                        <ArrowLeft className="h-5 w-5" />
                        <span className="sr-only">Back to Setlists</span>
                    </Link>
                </Button>
                <SetlistDetailContent />
            </main>
            {user && <BottomNavBar />}
        </div>
    );
}

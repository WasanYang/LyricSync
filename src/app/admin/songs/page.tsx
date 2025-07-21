
// src/app/admin/songs/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAllCloudSongs, deleteCloudSong, type Song } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, PlusCircle, Edit, ListMusic, Trash2, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function LoadingSkeleton() {
    return (
        <div className="flex-grow flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-8 w-64" />
                        <Skeleton className="h-10 w-32" />
                    </div>
                    <Skeleton className="h-10 w-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                    </div>
                </div>
            </main>
            <BottomNavBar />
        </div>
    );
}

export default function AdminSongsPage() {
    const { user, isSuperAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [songs, setSongs] = useState<Song[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    async function loadSongs() {
        setIsLoading(true);
        const cloudSongs = await getAllCloudSongs();
        // Filter to only show system songs
        const systemSongs = cloudSongs.filter(s => s.source === 'system');
        setSongs(systemSongs);
        setIsLoading(false);
    }

    useEffect(() => {
        if (!authLoading) {
            if (!user || !isSuperAdmin) {
                router.replace('/');
            } else {
                loadSongs();
            }
        }
    }, [user, isSuperAdmin, authLoading, router]);

    const filteredSongs = useMemo(() => {
        return songs.filter(song =>
            song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            song.artist.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [songs, searchTerm]);

    const handleDelete = async (songToDelete: Song) => {
        try {
            await deleteCloudSong(songToDelete.id);
            toast({
                title: "Song Deleted",
                description: `"${songToDelete.title}" has been removed from the cloud.`,
            });
            // Refresh the list
            setSongs(prevSongs => prevSongs.filter(s => s.id !== songToDelete.id));
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not delete the song.",
                variant: "destructive"
            });
        }
    };


    if (authLoading || !user || !isSuperAdmin) {
        return <LoadingSkeleton />;
    }
    
    const SongList = ({ songs }: { songs: Song[] }) => (
        <ul className="space-y-2">
            {songs.map(song => (
                <li key={song.id} className="flex items-center p-3 rounded-lg bg-muted/50 transition-colors hover:bg-muted/80 group">
                    <div className="flex-grow">
                        <Link href={`/lyrics/${song.id}`} className="font-semibold hover:underline">{song.title}</Link>
                        <p className="text-sm text-muted-foreground">{song.artist}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button asChild variant="ghost" size="icon">
                                        <Link href={`/lyrics/${song.id}/player`}>
                                            <Eye className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>View in Player</p></TooltipContent>
                            </Tooltip>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button asChild variant="ghost" size="icon">
                                        <Link href={`/song-editor?mode=cloud&id=${song.id}`}>
                                            <Edit className="h-4 w-4" />
                                        </Link>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Edit</p></TooltipContent>
                            </Tooltip>
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will permanently delete "{song.title}" from the cloud. This action cannot be undone.
                                            </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDelete(song)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TooltipTrigger>
                                <TooltipContent><p>Delete</p></TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </li>
            ))}
        </ul>
    );

    return (
        <div className="flex-grow flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
                <div className="space-y-8">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <h1 className="text-3xl font-bold font-headline">Manage Cloud Songs</h1>
                        <Button asChild>
                            <Link href="/song-editor?mode=cloud">
                                <PlusCircle className="mr-2 h-4 w-4" />
                                Create New Song
                            </Link>
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search songs..."
                            className="pl-10 bg-muted"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                            <Skeleton className="h-16 w-full" />
                        </div>
                    ) : (songs.length > 0 || searchTerm) ? (
                        <div className="space-y-6">
                            {filteredSongs.length > 0 ? (
                                <section>
                                    <SongList songs={filteredSongs} />
                                </section>
                            ) : (
                                 <div className="text-center py-16 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full">
                                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h2 className="text-xl font-headline font-semibold">No Results Found</h2>
                                    <p className="text-muted-foreground">No songs matched your search for "{searchTerm}".</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full">
                            <ListMusic className="h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-headline font-semibold">No Cloud Songs Found</h2>
                            <p className="text-muted-foreground">The cloud database is empty.</p>
                        </div>
                    )}
                </div>
            </main>
            <BottomNavBar />
        </div>
    );
}

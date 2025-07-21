
// src/app/admin/user-uploads/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAllCloudSongs, type Song } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Edit, ListMusic, Eye, Users } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import Link from 'next/link';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function LoadingSkeleton() {
    return (
        <div className="flex-grow flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <Skeleton className="h-8 w-64" />
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

export default function AdminUserUploadsPage() {
    const { user, isSuperAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [songs, setSongs] = useState<Song[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    async function loadSongs() {
        setIsLoading(true);
        const cloudSongs = await getAllCloudSongs();
        // Filter to only show songs uploaded by users
        const userUploadedSongs = cloudSongs.filter(s => s.source === 'user');
        setSongs(userUploadedSongs);
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
            song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
            song.uploaderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            song.uploaderEmail?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [songs, searchTerm]);

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
                        <p className="text-xs text-muted-foreground/80">
                            Uploaded by: {song.uploaderName || song.uploaderEmail || 'Unknown'}
                        </p>
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
                        <h1 className="text-3xl font-bold font-headline">User-Uploaded Songs</h1>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by title, artist, or uploader..."
                            className="pl-10 bg-muted focus-visible:ring-0 focus-visible:ring-offset-0"
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
                            <Users className="h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-headline font-semibold">No User-Uploaded Songs Found</h2>
                            <p className="text-muted-foreground">No users have uploaded any songs to the cloud yet.</p>
                        </div>
                    )}
                </div>
            </main>
            <BottomNavBar />
        </div>
    );
}

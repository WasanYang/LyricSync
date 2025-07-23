
// src/app/admin/user-setlists/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAllCloudSetlists, type Setlist } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { Search, ListMusic } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import Link from 'next/link';

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
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-20 w-full" />
                    </div>
                </div>
            </main>
            <BottomNavBar />
        </div>
    );
}

export default function AdminUserSetlistsPage() {
    const { user, isSuperAdmin, loading: authLoading } = useAuth();
    const router = useRouter();
    const [setlists, setSetlists] = useState<Setlist[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    async function loadSetlists() {
        setIsLoading(true);
        const cloudSetlists = await getAllCloudSetlists();
        setSetlists(cloudSetlists);
        setIsLoading(false);
    }

    useEffect(() => {
        if (!authLoading) {
            if (!user || !isSuperAdmin) {
                router.replace('/');
            } else {
                loadSetlists();
            }
        }
    }, [user, isSuperAdmin, authLoading, router]);

    const filteredSetlists = useMemo(() => {
        return setlists.filter(setlist =>
            setlist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            setlist.authorName?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [setlists, searchTerm]);

    if (authLoading || !user || !isSuperAdmin) {
        return <LoadingSkeleton />;
    }
    
    const SetlistList = ({ setlists }: { setlists: Setlist[] }) => (
        <ul className="space-y-3">
            {setlists.map(setlist => (
                <li key={setlist.firestoreId} className="bg-muted/50 transition-colors hover:bg-muted/80 rounded-lg">
                    <Link href={`/setlists/shared/${setlist.firestoreId}?mode=admin`} className="block p-4">
                       <div className="min-w-0">
                           <p className="font-semibold truncate hover:underline">{setlist.title}</p>
                           <p className="text-sm text-muted-foreground truncate">
                                {setlist.songIds.length} {setlist.songIds.length === 1 ? 'song' : 'songs'} • By: {setlist.authorName || 'Unknown'}
                           </p>
                        </div>
                    </Link>
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
                        <h1 className="text-3xl font-bold font-headline">User-Uploaded Setlists</h1>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input
                            placeholder="Search by title or author..."
                            className="pl-10 bg-muted focus-visible:ring-0 focus-visible:ring-offset-0"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    {isLoading ? (
                        <div className="space-y-2">
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                            <Skeleton className="h-20 w-full" />
                        </div>
                    ) : (setlists.length > 0 || searchTerm) ? (
                        <div className="space-y-6">
                            {filteredSetlists.length > 0 ? (
                                <section>
                                    <SetlistList setlists={filteredSetlists} />
                                </section>
                            ) : (
                                 <div className="text-center py-16 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full">
                                    <Search className="h-12 w-12 text-muted-foreground mb-4" />
                                    <h2 className="text-xl font-headline font-semibold">No Results Found</h2>
                                    <p className="text-muted-foreground">No setlists matched your search for "{searchTerm}".</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-16 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full">
                            <ListMusic className="h-12 w-12 text-muted-foreground mb-4" />
                            <h2 className="text-xl font-headline font-semibold">No User Setlists Found</h2>
                            <p className="text-muted-foreground">No users have uploaded any setlists to the cloud yet.</p>
                        </div>
                    )}
                </div>
            </main>
            <BottomNavBar />
        </div>
    );
}

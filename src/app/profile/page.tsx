
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAllSavedSongs, getSetlists } from '@/lib/db';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Music, ListMusic, User, LogOut } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function StatCard({ icon: Icon, title, value, isLoading }: { icon: React.ElementType, title: string, value: number, isLoading: boolean }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <Skeleton className="h-8 w-1/4" />
                ) : (
                    <div className="text-2xl font-bold">{value}</div>
                )}
            </CardContent>
        </Card>
    )
}

function ProfileLoadingSkeleton() {
    return (
        <div className="flex-grow flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
                <div className="space-y-8">
                    <div className="flex items-center gap-4">
                        <Skeleton className="h-20 w-20 rounded-full" />
                        <div className="space-y-2">
                            <Skeleton className="h-7 w-48" />
                            <Skeleton className="h-5 w-64" />
                        </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">My Songs</CardTitle>
                                <Music className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent><Skeleton className="h-8 w-1/4" /></CardContent>
                        </Card>
                        <Card>
                             <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">My Setlists</CardTitle>
                                <ListMusic className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent><Skeleton className="h-8 w-1/4" /></CardContent>
                        </Card>
                    </div>
                    <Skeleton className="h-10 w-full md:w-48" />
                </div>
            </main>
            <BottomNavBar />
        </div>
    )
}


export default function ProfilePage() {
    const { user, loading: authLoading, logout } = useAuth();
    const router = useRouter();

    const [songCount, setSongCount] = useState(0);
    const [setlistCount, setSetlistCount] = useState(0);
    const [isLoadingStats, setIsLoadingStats] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.replace('/welcome');
        }
    }, [user, authLoading, router]);

    useEffect(() => {
        async function fetchStats() {
            if (user) {
                setIsLoadingStats(true);
                try {
                    const songs = await getAllSavedSongs();
                    const setlists = await getSetlists(user.uid);
                    setSongCount(songs.length);
                    setSetlistCount(setlists.length);
                } catch (error) {
                    console.error("Failed to fetch user stats", error);
                } finally {
                    setIsLoadingStats(false);
                }
            }
        }
        fetchStats();
    }, [user]);

    if (authLoading || !user) {
        return <ProfileLoadingSkeleton />;
    }
    
    const isAnonymous = user.isAnonymous;

    return (
        <div className="flex-grow flex flex-col">
            <Header />
            <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
                <div className="space-y-8 max-w-2xl mx-auto">
                    <div className="flex flex-col items-center text-center space-y-4 md:flex-row md:text-left md:space-y-0 md:space-x-6">
                        <Avatar className="h-24 w-24 text-4xl">
                            {!isAnonymous && <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />}
                            <AvatarFallback>
                                {isAnonymous ? <User className="h-10 w-10" /> : (user.displayName?.[0].toUpperCase() || 'U')}
                            </AvatarFallback>
                        </Avatar>
                        <div className="space-y-1">
                            <h1 className="text-2xl font-bold font-headline">{isAnonymous ? 'Guest User' : user.displayName}</h1>
                            {!isAnonymous && <p className="text-muted-foreground">{user.email}</p>}
                        </div>
                    </div>

                    <div>
                        <h2 className="text-lg font-semibold mb-4">Statistics</h2>
                        <div className="grid gap-4 md:grid-cols-2">
                           <StatCard icon={Music} title="My Songs" value={songCount} isLoading={isLoadingStats} />
                           <StatCard icon={ListMusic} title="My Setlists" value={setlistCount} isLoading={isLoadingStats} />
                        </div>
                    </div>
                    
                    <Button onClick={logout} variant="outline" className="w-full md:w-auto">
                        <LogOut className="mr-2 h-4 w-4" /> Sign Out
                    </Button>
                </div>
            </main>
            <BottomNavBar />
        </div>
    );
}

'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getAllSavedSongs, getSetlists } from '@/lib/db';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Music, ListMusic, User, LogOut } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 48 48' {...props}>
      <path
        fill='#FFC107'
        d='M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z'
      ></path>
      <path
        fill='#FF3D00'
        d='M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z'
      ></path>
      <path
        fill='#4CAF50'
        d='M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z'
      ></path>
      <path
        fill='#1976D2'
        d='M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C43.021,36.251,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z'
      ></path>
    </svg>
  );
}

function StatCard({
  icon: Icon,
  title,
  value,
  isLoading,
}: {
  icon: React.ElementType;
  title: string;
  value: number;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <Icon className='h-4 w-4 text-muted-foreground' />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className='h-8 w-1/4' />
        ) : (
          <div className='text-2xl font-bold'>{value}</div>
        )}
      </CardContent>
    </Card>
  );
}

function ProfileLoadingSkeleton() {
  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
        <div className='space-y-8'>
          <div className='flex items-center gap-4'>
            <Skeleton className='h-20 w-20 rounded-full' />
            <div className='space-y-2'>
              <Skeleton className='h-7 w-48' />
              <Skeleton className='h-5 w-64' />
            </div>
          </div>
          <div className='grid gap-4 md:grid-cols-2'>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>My Songs</CardTitle>
                <Music className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <Skeleton className='h-8 w-1/4' />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  My Setlists
                </CardTitle>
                <ListMusic className='h-4 w-4 text-muted-foreground' />
              </CardHeader>
              <CardContent>
                <Skeleton className='h-8 w-1/4' />
              </CardContent>
            </Card>
          </div>
          <Skeleton className='h-10 w-full md:w-48' />
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

export default function ProfilePage() {
  const { user, loading: authLoading, logout, signInWithGoogle } = useAuth();

  const [songCount, setSongCount] = useState(0);
  const [setlistCount, setSetlistCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      if (user && !user.isAnonymous) {
        setIsLoadingStats(true);
        try {
          const songs = await getAllSavedSongs(user.uid);
          const setlists = await getSetlists(user.uid);
          setSongCount(songs.length);
          setSetlistCount(setlists.length);
        } catch (error) {
          console.error('Failed to fetch user stats', error);
        } finally {
          setIsLoadingStats(false);
        }
      } else {
        setIsLoadingStats(false);
      }
    }
    fetchStats();
  }, [user]);

  if (authLoading || !user) {
    return <ProfileLoadingSkeleton />;
  }

  const isAnonymous = user.isAnonymous;

  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
        <div className='space-y-8 max-w-2xl mx-auto'>
          <div className='flex flex-col items-center text-center space-y-4 md:flex-row md:text-left md:space-y-0 md:space-x-6'>
            <Avatar className='h-24 w-24 text-4xl'>
              {!isAnonymous && (
                <AvatarImage
                  src={user.photoURL || ''}
                  alt={user.displayName || 'User'}
                />
              )}
              <AvatarFallback>
                {isAnonymous ? (
                  <User className='h-10 w-10' />
                ) : (
                  user.displayName?.[0].toUpperCase() || 'U'
                )}
              </AvatarFallback>
            </Avatar>
            <div className='space-y-1'>
              <h1 className='text-2xl font-bold font-headline'>
                {isAnonymous ? 'Guest User' : user.displayName}
              </h1>
              {!isAnonymous && (
                <p className='text-muted-foreground'>{user.email}</p>
              )}
            </div>
          </div>

          {isAnonymous ? (
            <Card className='bg-primary/10 border-primary/20'>
              <CardHeader>
                <CardTitle className='font-headline text-center'>
                  Unlock Full Access
                </CardTitle>
                <CardDescription className='text-center'>
                  Sign in with Google to save your songs, create setlists, and
                  sync your data across devices.
                </CardDescription>
              </CardHeader>
              <CardContent className='flex justify-center'>
                <Button onClick={signInWithGoogle} size='lg'>
                  <GoogleIcon className='mr-2 h-5 w-5' />
                  Sign In with Google
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div>
              <h2 className='text-lg font-semibold mb-4'>Statistics</h2>
              <div className='grid gap-4 md:grid-cols-2'>
                <StatCard
                  icon={Music}
                  title='My Songs'
                  value={songCount}
                  isLoading={isLoadingStats}
                />
                <StatCard
                  icon={ListMusic}
                  title='My Setlists'
                  value={setlistCount}
                  isLoading={isLoadingStats}
                />
              </div>
            </div>
          )}

          <Button
            onClick={logout}
            variant='outline'
            className='w-full md:w-auto'
          >
            <LogOut className='mr-2 h-4 w-4' /> Sign Out
          </Button>
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}


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
import { Music, ListMusic, User, LogOut, ChevronRight } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { GoogleIcon } from '@/components/ui/GoogleIcon';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

function StatCard({
  icon: Icon,
  title,
  value,
  isLoading,
  href,
}: {
  icon: React.ElementType;
  title: string;
  value: number;
  isLoading: boolean;
  href: string;
}) {
  const content = (
    <Card className='hover:bg-muted/80 transition-colors'>
      <CardContent className='p-4 flex items-center justify-between'>
        <div className='flex items-center gap-4'>
          <div className='p-3 bg-muted rounded-full'>
            <Icon className='h-6 w-6 text-muted-foreground' />
          </div>
          <div>
            <p className='font-semibold'>{title}</p>
            {isLoading ? (
              <Skeleton className='h-6 w-12 mt-1' />
            ) : (
              <p className='text-sm text-muted-foreground'>
                {value} {value === 1 ? 'item' : 'items'}
              </p>
            )}
          </div>
        </div>
        <ChevronRight className='h-5 w-5 text-muted-foreground' />
      </CardContent>
    </Card>
  );

  return <Link href={href}>{content}</Link>;
}

function ProfileLoadingSkeleton() {
  const t = useTranslations('profile');

  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
        <div className='space-y-8 max-w-2xl mx-auto'>
          <div className='flex flex-col items-center text-center space-y-4 md:flex-row md:text-left md:space-y-0 md:space-x-6'>
            <Skeleton className='h-24 w-24 rounded-full' />
            <div className='space-y-2'>
              <Skeleton className='h-7 w-48' />
              <Skeleton className='h-5 w-64' />
            </div>
          </div>
          <div>
            <h2 className='text-lg font-semibold mb-4'>{t('stats')}</h2>
            <div className='grid gap-4 md:grid-cols-1'>
              <Card>
                <CardContent className='p-4 flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <Skeleton className='h-12 w-12 rounded-full' />
                    <div>
                      <Skeleton className='h-5 w-24' />
                      <Skeleton className='h-4 w-16 mt-1' />
                    </div>
                  </div>
                  <Skeleton className='h-5 w-5' />
                </CardContent>
              </Card>
              <Card>
                <CardContent className='p-4 flex items-center justify-between'>
                  <div className='flex items-center gap-4'>
                    <Skeleton className='h-12 w-12 rounded-full' />
                    <div>
                      <Skeleton className='h-5 w-24' />
                      <Skeleton className='h-4 w-16 mt-1' />
                    </div>
                  </div>
                  <Skeleton className='h-5 w-5' />
                </CardContent>
              </Card>
            </div>
          </div>
          <Skeleton className='h-10 w-full md:w-48' />
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

export default function ProfilePage() {
  const t = useTranslations('profile');
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
              {!isAnonymous && user.photoURL && (
                <AvatarImage
                  src={user.photoURL}
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
                {isAnonymous ? t('guestUser') : user.displayName}
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
                  {t('unlockTitle')}
                </CardTitle>
                <CardDescription className='text-center'>
                  {t('unlockDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className='flex justify-center'>
                <Button onClick={signInWithGoogle} size='lg'>
                  <GoogleIcon className='mr-2 h-5 w-5' />
                  {t('signInGoogle')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div>
              <h2 className='text-lg font-semibold mb-4'>{t('stats')}</h2>
              <div className='grid gap-3 md:grid-cols-1'>
                <StatCard
                  icon={Music}
                  title={t('mySongs')}
                  value={songCount}
                  isLoading={isLoadingStats}
                  href='/library'
                />
                <StatCard
                  icon={ListMusic}
                  title={t('mySetlists')}
                  value={setlistCount}
                  isLoading={isLoadingStats}
                  href='/setlists'
                />
              </div>
            </div>
          )}

          <Button
            onClick={logout}
            variant='outline'
            className='w-full md:w-auto'
          >
            <LogOut className='mr-2 h-4 w-4' /> {t('signOut')}
          </Button>
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

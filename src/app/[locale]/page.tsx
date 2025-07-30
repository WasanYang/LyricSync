// src/app/page.tsx
'use client';

import {
  getSetlists,
  type Setlist,
  getAllCloudSongs,
  getPublicSetlists,
} from '@/lib/db';
import type { Song } from '@/lib/songs';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { pageSEOConfigs } from '@/lib/seo';
import RecommendedSongs from '@/components/RecommendedSongs';
import WelcomeCard from '@/components/WelcomeCard';
import { RecentSetlists } from '@/components/RecentSetlists';

function LoadingSkeleton() {
  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 space-y-12 pb-24 md:pb-8'>
        {/* Welcome & Quick Actions Skeleton */}
        <div className='space-y-4'>
          <Skeleton className='h-8 w-48' />
          <div className='grid grid-cols-2 gap-4'>
            <Skeleton className='h-12 w-full' />
            <Skeleton className='h-12 w-full' />
          </div>
        </div>
        {/* Premium Card Skeleton */}
        <Skeleton className='h-28 w-full' />
        {/* Recent Setlists Skeleton */}
        <div className='space-y-4'>
          <Skeleton className='h-7 w-32' />
          <div className='space-y-2'>
            <Skeleton className='h-16 w-full' />
            <Skeleton className='h-16 w-full' />
          </div>
        </div>
        {/* Recommended Songs Skeleton */}
        <div className='space-y-4'>
          <Skeleton className='h-7 w-40' />
          <Skeleton className='h-10 w-full max-w-xs' />
          <div className='flex space-x-4 pt-2'>
            <Skeleton className='h-36 w-[45%] sm:w-1/4' />
            <Skeleton className='h-36 w-[45%] sm:w-1/4' />
            <Skeleton className='h-36 hidden sm:block sm:w-1/4' />
          </div>
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

export default function Home() {
  const { user, loading } = useAuth();
  const [recentSetlists, setRecentSetlists] = useState<Setlist[]>([]);
  const [systemSongs, setSystemSongs] = useState<Song[]>([]);
  const [isLoadingSetlists, setIsLoadingSetlists] = useState(true);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);

  const recentReleases = useMemo(
    () =>
      [...systemSongs]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 5),
    [systemSongs]
  );
  const popularHits = useMemo(
    () => [...systemSongs].sort(() => 0.5 - Math.random()).slice(0, 5),
    [systemSongs]
  ); // Mock popularity with random sort for now

  useEffect(() => {
    async function loadData() {
      // Load data regardless of login status
      setIsLoadingSetlists(true);
      setIsLoadingSongs(true);

      try {
        // Always load system songs (public data)
        const allSongs = await getAllCloudSongs();
        const filteredSystemSongs = allSongs.filter(
          (song) => song.source === 'system'
        );
        setSystemSongs(filteredSystemSongs);
      } catch (error) {
        console.error('Failed to load system songs', error);
      } finally {
        setIsLoadingSongs(false);
      }

      try {
        const publicLists = await getPublicSetlists();
        const _recommendedSetlists = user
          ? publicLists.filter((sl) => sl.userId !== user.uid)
          : publicLists;
      } catch (error) {
        console.error('Failed to load public setlists', error);
      } finally {
      }

      if (user && !user.isAnonymous) {
        try {
          const allSetlists = await getSetlists(user.uid);
          const sorted = allSetlists.sort(
            (a, b) =>
              (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)
          );
          setRecentSetlists(sorted.slice(0, 3));
        } catch (error) {
          console.error('Failed to load recent setlists', error);
        }
      }
      setIsLoadingSetlists(false);
    }

    loadData();
  }, [user]);

  if (loading) {
    return <LoadingSkeleton />;
  }

  const featuredSongs = systemSongs.slice(0, 5);

  return (
    <>
      <SEOHead config={pageSEOConfigs.home()} />
      <div className='flex-grow flex flex-col'>
        <Header />
        <main className='flex-grow container mx-auto px-4 py-8 space-y-12 pb-24 md:pb-12'>
          <WelcomeCard user={user} />

          {/* Recent Setlists - only for logged in users */}
          <RecentSetlists
            user={user}
            recentSetlists={recentSetlists}
            isLoadingSetlists={isLoadingSetlists}
          />

          {/* Recommended Setlists */}
          {/* <RecommendedSetlists
            publicSetlists={publicSetlists}
            isLoadingPublicSetlists={isLoadingPublicSetlists}
          /> */}

          {/* Recommended Songs */}
          <RecommendedSongs
            featuredSongs={featuredSongs}
            popularHits={popularHits}
            recentReleases={recentReleases}
            isLoadingSongs={isLoadingSongs}
          />
        </main>
        <Footer />
        <BottomNavBar />
      </div>
    </>
  );
}

// src/components/page/HomeClientComponent.tsx
'use client';

import { getSetlists, type Setlist, getAllCloudSongs } from '@/lib/db';
import type { Song } from '@/lib/songs';
import Header from '@/components/Header';
import { useAuth } from '@/context/AuthContext';
import { useEffect, useState, useMemo, useRef } from 'react';
import Footer from '@/components/Footer';
import RecommendedSongs from '@/components/RecommendedSongs';
import WelcomeCard from '@/components/WelcomeCard';
import { HomeLoadingSkeleton } from '@/components/HomeLoadingSkeleton';
import dynamic from 'next/dynamic';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';

const RecentSetlists = dynamic(
  () => import('@/components/RecentSetlists').then((mod) => mod.RecentSetlists),
  {
    ssr: false,
  }
);

const BottomNavBar = dynamic(
  () => import('@/components/BottomNavBar').then((mod) => mod.default),
  {
    ssr: false,
  }
);

function HomeClientComponent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [recentSetlists, setRecentSetlists] = useState<Setlist[]>([]);
  const [systemSongs, setSystemSongs] = useState<Song[]>([]);
  const [isLoadingSetlists, setIsLoadingSetlists] = useState(true);
  const [isLoadingSongs, setIsLoadingSongs] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const t = useTranslations('search');
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const searchFormRef = useRef<HTMLFormElement>(null);

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
    () => [...systemSongs].sort(() => 0.5 - Math.random()).slice(0, 10), // Show more popular hits
    [systemSongs]
  );

  useEffect(() => {
    async function loadData() {
      setIsLoadingSetlists(true);
      setIsLoadingSongs(true);

      try {
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

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
    }
  };

  if (loading) {
    return <HomeLoadingSkeleton />;
  }

  const featuredSongs = systemSongs.slice(0, 10); // Show more featured songs

  return (
    <>
      <div className='flex-grow flex flex-col'>
        <Header />

        <main className='flex-grow container mx-auto px-4 space-y-8 pb-24 md:pb-12'>
          <form
            ref={searchFormRef}
            onSubmit={handleSearchSubmit}
            className={cn(
              'relative w-full transition-all duration-300',
              isHeaderScrolled &&
                'fixed top-2 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-lg'
            )}
          >
            <Search className='absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground z-10' />
            <Input
              type='search'
              placeholder={t('placeholder')}
              className='w-full rounded-full border bg-background py-2 pl-10 text-base shadow-sm'
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </form>

          <WelcomeCard user={user} />

          <RecentSetlists
            user={user}
            recentSetlists={recentSetlists}
            isLoadingSetlists={isLoadingSetlists}
          />

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

export { HomeClientComponent };

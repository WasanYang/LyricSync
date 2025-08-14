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
import { NotificationBell } from '../NotificationBell';
import HamburgerMenu from '../HamburgerMenu';

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
    const handleScroll = () => {
      if (searchFormRef.current) {
        const { top } = searchFormRef.current.getBoundingClientRect();
        // The threshold should be when the top of the search bar goes above 0.
        setIsHeaderScrolled(top < 0);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

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

  const searchInput = (
    <input
      type='search'
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
      placeholder={t('placeholder')}
      className='w-full py-2 px-3 pl-10 text-base border rounded-full bg-white text-black placeholder:text-black focus:outline-none active:outline-none'
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='none' stroke='%23000' stroke-width='2' stroke-linecap='round' stroke-linejoin='round' class='lucide lucide-search'%3E%3Ccircle cx='11' cy='11' r='8'/%3E%3Cpath d='m21 21-4.3-4.3'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: '12px center',
        backgroundSize: '20px',
      }}
    />
  );

  return (
    <>
      <div className='flex-grow flex flex-col'>
        <div
          className={cn(
            'transition-opacity duration-300',
            isHeaderScrolled ? 'opacity-0' : 'opacity-100'
          )}
        >
          <Header />
        </div>

        {isHeaderScrolled && (
          <header className='fixed top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
            <div className='flex h-16 items-center justify-between px-4'>
              <form
                onSubmit={handleSearchSubmit}
                className='w-full'
              >
                {searchInput}
              </form>
            </div>
          </header>
        )}

        <main
          className={cn('flex-grow container mx-auto px-4 py-4 space-y-4 pb-24 md:pb-12', isHeaderScrolled && 'pt-16')}
        >
          <WelcomeCard user={user} />
          <form
            ref={searchFormRef}
            onSubmit={handleSearchSubmit}
            className='w-full'
          >
            {searchInput}
          </form>

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

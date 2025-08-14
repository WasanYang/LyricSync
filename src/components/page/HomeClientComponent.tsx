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
    <div className='relative w-full flex items-center gap-2 group'>
      <Search className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black pointer-events-none' />
      <Input
        name='search-keyword'
        id='search-keyword'
        type='search'
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={t('placeholder')}
        className='w-full rounded-full border bg-white py-2 pl-8 text-base text-black placeholder:text-black placeholder:font-medium font-medium'
      />
      <span
        className={cn(
          'cursor-pointer text-emerald-500 transition-all duration-300 whitespace-nowrap overflow-hidden pr-4',
          searchTerm.length > 0
            ? 'max-w-[120px] opacity-100'
            : 'max-w-0 opacity-0 pointer-events-none'
        )}
        onClick={() => setSearchTerm('')}
      >
        Cancel
      </span>
    </div>
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
              <form onSubmit={handleSearchSubmit} className='w-full'>
                {searchInput}
              </form>
            </div>
          </header>
        )}

        <main className='flex-grow container mx-auto px-4 space-y-4 pb-24 md:pb-12'>
          <WelcomeCard user={user} />
          <form
            ref={searchFormRef}
            onSubmit={handleSearchSubmit}
            className='w-full pt-4'
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

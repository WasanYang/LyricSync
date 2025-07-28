'use client';

import { useState, useMemo, useEffect } from 'react';
import { getAllCloudSongs, type Setlist, getPublicSetlists } from '@/lib/db';
import type { Song } from '@/lib/songs';
import { Input } from '@/components/ui/input';
import { Search, ListMusic } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import SongStatusButton from '@/components/SongStatusButton';
import Header from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import SEOHead from '@/components/SEOHead';
import { pageSEOConfigs } from '@/lib/seo';
import SearchCategory from './component/SearchCategory';
import SongListItem from './component/SongListItem';

function SetlistCard({ setlist }: { setlist: Setlist }) {
  const songCount = setlist.songIds.length;
  return (
    <Link href={`/shared/setlists/${setlist.firestoreId}`} className='block'>
      <Card className='hover:bg-muted/50 transition-colors'>
        <CardContent className='p-4 flex items-center gap-4'>
          <div className='p-3 bg-muted rounded-md'>
            <ListMusic className='h-6 w-6 text-muted-foreground' />
          </div>
          <div>
            <p className='font-semibold font-headline truncate'>
              {setlist.title}
            </p>
            <p className='text-sm text-muted-foreground truncate'>
              {songCount} {songCount === 1 ? 'song' : 'songs'} • by{' '}
              {setlist.authorName}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function SearchPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPrefix, setSelectedPrefix] = useState<string | null>(null);

  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [publicSetlists, setPublicSetlists] = useState<Setlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAllData = async () => {
      setIsLoading(true);
      try {
        const [cloudSongs, publicLists] = await Promise.all([
          getAllCloudSongs(),
          getPublicSetlists(),
        ]);
        const systemSongs = cloudSongs.filter((s) => s.source === 'system');
        setAllSongs(systemSongs);
        setPublicSetlists(publicLists);
      } catch (error) {
        console.error('Failed to load search data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllData();
  }, []);

  // Utility: Remove Thai vowels and get first consonant
  function getFirstConsonant(str: string): string | undefined {
    const THAI_CONSONANTS = [
      'ก',
      'ข',
      'ฃ',
      'ค',
      'ฅ',
      'ฆ',
      'ง',
      'จ',
      'ฉ',
      'ช',
      'ซ',
      'ฌ',
      'ญ',
      'ฎ',
      'ฏ',
      'ฐ',
      'ฑ',
      'ฒ',
      'ณ',
      'ด',
      'ต',
      'ถ',
      'ท',
      'ธ',
      'น',
      'บ',
      'ป',
      'ผ',
      'ฝ',
      'พ',
      'ฟ',
      'ภ',
      'ม',
      'ย',
      'ร',
      'ฤ',
      'ล',
      'ฦ',
      'ว',
      'ศ',
      'ษ',
      'ส',
      'ห',
      'ฬ',
      'อ',
      'ฮ',
    ];
    const EN_REGEX = /^[A-Z]$/;
    const TH_REGEX = /^[ก-ฮ]$/;
    const chars = str.trim().split('');
    for (const c of chars) {
      const up = c.toUpperCase();
      if (EN_REGEX.test(up) || TH_REGEX.test(up)) {
        return up;
      }
      if (THAI_CONSONANTS.includes(c)) {
        return c;
      }
    }
    return undefined;
  }

  // Group available prefixes from all songs (Thai/English, ignore vowels)
  const availablePrefixes = useMemo(() => {
    const set = new Set<string>();
    allSongs.forEach((song) => {
      const first = getFirstConsonant(song.title);
      if (first) set.add(first);
    });
    return ['All', ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [allSongs]);

  // Filter songs by search or selected prefix
  const filteredSongs = useMemo(() => {
    if (searchTerm) {
      return allSongs.filter(
        (song) =>
          song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          song.artist.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    if (selectedPrefix && selectedPrefix !== 'All') {
      return allSongs.filter((song) => {
        const first = getFirstConsonant(song.title);
        return first === selectedPrefix;
      });
    }
    return allSongs;
  }, [searchTerm, selectedPrefix, allSongs]);

  const newReleases = useMemo(
    () =>
      [...allSongs]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 4),
    [allSongs]
  );
  const trendingHits = useMemo(
    () => [...allSongs].sort(() => 0.5 - Math.random()).slice(0, 4),
    [allSongs]
  ); // Placeholder

  return (
    <>
      <SEOHead config={pageSEOConfigs.search(searchTerm)} />
      <div className='flex-grow flex flex-col'>
        <Header />
        <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
          <div className='space-y-8'>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10' />
              <Input
                type='search'
                placeholder='Search songs, artists, and public setlists...'
                className='pl-10 text-base bg-muted focus-visible:ring-0 focus-visible:ring-offset-0'
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setSelectedPrefix(null);
                }}
              />
            </div>

            {/* Prefix A-Z filter */}
            {/* Prefix filter (A-Z, ก-ฮ, All) */}
            {!searchTerm && availablePrefixes.length > 0 && (
              <div className='flex flex-wrap gap-2 py-2'>
                {availablePrefixes.map((prefix) => (
                  <button
                    key={prefix}
                    className={`px-3 py-1 rounded-full border text-base font-semibold transition-colors ${
                      selectedPrefix === prefix ||
                      (prefix === 'All' &&
                        (selectedPrefix === null || selectedPrefix === 'All'))
                        ? 'bg-primary text-white'
                        : 'bg-muted text-primary'
                    }`}
                    onClick={() =>
                      setSelectedPrefix(prefix === 'All' ? null : prefix)
                    }
                  >
                    {prefix}
                  </button>
                ))}
              </div>
            )}

            {/* Song list by prefix or search */}
            {(searchTerm || selectedPrefix) && (
              <section>
                <h2 className='text-xl font-bold font-headline mb-4'>
                  {searchTerm
                    ? `Results for "${searchTerm}"`
                    : selectedPrefix
                    ? `Songs starting with "${selectedPrefix}"`
                    : 'All Songs'}
                </h2>
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2'>
                  {filteredSongs.length > 0 ? (
                    filteredSongs.map((song) => (
                      <SongListItem key={song.id} song={song} />
                    ))
                  ) : (
                    <div className='col-span-2 text-center py-8 text-muted-foreground'>
                      No songs found.
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Trending & New Releases (default) */}
            {!searchTerm && !selectedPrefix && (
              <div className='space-y-10'>
                <SearchCategory
                  title='New Releases'
                  songs={newReleases}
                  isLoading={isLoading}
                />
                <SearchCategory
                  title='Trending Hits'
                  songs={trendingHits}
                  isLoading={isLoading}
                />
                <section>
                  <h2 className='text-xl font-bold font-headline mb-4'>
                    Browse Public Setlists
                  </h2>
                  {isLoading ? (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      <Skeleton className='h-20 w-full' />
                      <Skeleton className='h-20 w-full' />
                    </div>
                  ) : publicSetlists.length > 0 ? (
                    <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                      {publicSetlists.slice(0, 4).map((setlist) => (
                        <SetlistCard
                          key={setlist.firestoreId}
                          setlist={setlist}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className='text-center py-10 border-2 border-dashed rounded-lg'>
                      <p className='text-muted-foreground'>
                        No public setlists available yet.
                      </p>
                    </div>
                  )}
                </section>
              </div>
            )}
          </div>
        </main>
        <BottomNavBar />
      </div>
    </>
  );
}

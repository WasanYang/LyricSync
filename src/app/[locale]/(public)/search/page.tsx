'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getAllCloudSongs, type Setlist, getPublicSetlists } from '@/lib/db';
import type { Song } from '@/lib/songs';
import { Input } from '@/components/ui/input';
import { Search, ListMusic } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';
import Link from 'next/link';
import Header from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import SEOHead from '@/components/SEOHead';
import { pageSEOConfigs } from '@/lib/seo';
import SearchCategory from './component/SearchCategory';
import SongListItem from './component/SongListItem';
import AlphabeticalIndex from './component/AlphabeticalIndex';
import { useTranslations } from 'next-intl';

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
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  const selectedChar = searchParams.get('char');
  const t = useTranslations('search');

  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [publicSetlists, setPublicSetlists] = useState<Setlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const handleSearchChange = (term: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (term) {
      params.set('q', term);
    } else {
      params.delete('q');
    }
    // Clear char filter when searching
    params.delete('char');
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleCharSelect = (char: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('char', char);
    // Clear search term when filtering by char
    params.delete('q');
    router.replace(`${pathname}?${params.toString()}`);
  };

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

  const filteredSongs = useMemo(() => {
    if (!searchTerm) return [];
    return allSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allSongs]);

  const characterFilteredSongs = useMemo(() => {
    if (!selectedChar) return [];
    return allSongs.filter((song) =>
      song.title.toLowerCase().startsWith(selectedChar.toLowerCase())
    );
  }, [selectedChar, allSongs]);

  const filteredSetlists = useMemo(() => {
    if (!searchTerm) return [];
    return publicSetlists.filter(
      (setlist) =>
        setlist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setlist.authorName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, publicSetlists]);

  const newReleases = useMemo(
    () =>
      [...allSongs]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
        .slice(0, 8),
    [allSongs]
  );

  const trendingHits = useMemo(
    () => [...allSongs].sort(() => 0.5 - Math.random()).slice(0, 8),
    [allSongs]
  );

  const renderDiscoveryContent = () => (
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
              <SetlistCard key={setlist.firestoreId} setlist={setlist} />
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
  );

  const renderSearchResults = () => (
    <div className='space-y-8'>
      {filteredSongs.length > 0 && (
        <section>
          <h2 className='text-xl font-bold font-headline mb-4'>Songs</h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2'>
            {filteredSongs.map((song) => (
              <SongListItem key={song.id} song={song} />
            ))}
          </div>
        </section>
      )}
      {filteredSetlists.length > 0 && (
        <section>
          <h2 className='text-xl font-bold font-headline mb-4'>Setlists</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            {filteredSetlists.map((setlist) => (
              <SetlistCard key={setlist.firestoreId} setlist={setlist} />
            ))}
          </div>
        </section>
      )}
      {filteredSongs.length === 0 && filteredSetlists.length === 0 && (
        <div className='text-center py-16 text-muted-foreground'>
          <p>No results found for &quot;{searchTerm}&quot;.</p>
        </div>
      )}
    </div>
  );

  const renderCharacterFilterResults = () => (
    <div className='space-y-8'>
      {characterFilteredSongs.length > 0 ? (
        <section>
          <h2 className='text-xl font-bold font-headline mb-4'>
            Songs starting with &quot;{selectedChar}&quot;
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2'>
            {characterFilteredSongs.map((song) => (
              <SongListItem key={song.id} song={song} />
            ))}
          </div>
        </section>
      ) : (
        <div className='text-center py-16 text-muted-foreground'>
          <p>No songs found starting with &quot;{selectedChar}&quot;.</p>
        </div>
      )}
    </div>
  );

  const showDiscovery = !searchTerm && !selectedChar;

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
                placeholder={t('placeholder')}
                className='pl-10 text-base bg-muted focus-visible:ring-0 focus-visible:ring-offset-0'
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            <AlphabeticalIndex
              selectedChar={selectedChar}
              onCharSelect={handleCharSelect}
            />

            {showDiscovery
              ? renderDiscoveryContent()
              : searchTerm
              ? renderSearchResults()
              : renderCharacterFilterResults()}
          </div>
        </main>
        <BottomNavBar />
      </div>
    </>
  );
}

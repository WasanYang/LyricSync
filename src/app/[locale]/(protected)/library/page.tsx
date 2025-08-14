'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { getAllSavedSongs, toMillisSafe } from '@/lib/db';
import type { Song } from '@/lib/songs';
import {
  Music,
  PlusCircle,
  Search as SearchIcon,
  Library,
  LogIn,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/shared';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import SongListItem from './_component/SongListItem';
import LocalsLink from '@/components/ui/LocalsLink';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';
import { GoogleIcon } from '@/components/ui/GoogleIcon';
import Footer from '@/components/Footer';
import BottomNavBar from '@/components/BottomNavBar';

const PAGE_SIZE = 10;

function LoadingSkeleton() {
  return (
    <div className='flex-grow flex flex-col'>
      <header className='sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4'>
          <div className='flex items-center gap-2'>
            <Library className='h-6 w-6' />
            <h1 className='text-2xl font-bold font-headline tracking-tight'>
              Library
            </h1>
          </div>
          <Button variant='ghost' size='icon' asChild>
            <LocalsLink href='/song-editor'>
              <PlusCircle className='h-6 w-6' />
              <span className='sr-only'>Add new song</span>
            </LocalsLink>
          </Button>
        </div>
      </header>
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
        <div className='space-y-4'>
          <Skeleton className='h-12 w-full rounded-full' />
          <div className='space-y-2 pt-4'>
            <Skeleton className='h-16 w-full' />
            <Skeleton className='h-16 w-full' />
            <Skeleton className='h-16 w-full' />
          </div>
        </div>
      </main>
      <Footer />
      <BottomNavBar />
    </div>
  );
}

export default function LibraryPage() {
  const t = useTranslations('library');
  const commonT = useTranslations('profile');
  const { user, loading: authLoading, signInWithGoogle } = useAuth();

  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [songsOnPage, setSongsOnPage] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const loadSongs = useCallback(async () => {
    if (!user || user.isAnonymous) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const loadedSongs = await getAllSavedSongs(user.uid);
    const sortedSongs = loadedSongs.sort((a, b) => {
      if (a.source === 'user' && b.source !== 'user') return -1;
      if (a.source !== 'user' && b.source === 'user') return 1;
      return (
        (toMillisSafe(b.updatedAt) || 0) - (toMillisSafe(a.updatedAt) || 0)
      );
    });
    setAllSongs(sortedSongs);
    setIsLoading(false);
  }, [user]);

  useEffect(() => {
    loadSongs();
  }, [loadSongs]);

  const filteredSongs = useMemo(() => {
    if (!searchTerm) {
      return allSongs;
    }
    return allSongs.filter(
      (song) =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allSongs, searchTerm]);

  useEffect(() => {
    const newTotalPages = Math.ceil(filteredSongs.length / PAGE_SIZE);
    setTotalPages(newTotalPages);

    let pageToSet = currentPage;
    if (currentPage > newTotalPages) {
      pageToSet = Math.max(1, newTotalPages);
      setCurrentPage(pageToSet);
    }

    const startIndex = (pageToSet - 1) * PAGE_SIZE;
    setSongsOnPage(filteredSongs.slice(startIndex, startIndex + PAGE_SIZE));
  }, [filteredSongs, currentPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious
              href='#'
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(currentPage - 1);
              }}
              aria-disabled={currentPage <= 1}
              className={
                currentPage <= 1 ? 'pointer-events-none opacity-50' : ''
              }
            />
          </PaginationItem>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <PaginationItem key={page}>
              <PaginationLink
                href='#'
                isActive={page === currentPage}
                onClick={(e) => {
                  e.preventDefault();
                  handlePageChange(page);
                }}
              >
                {page}
              </PaginationLink>
            </PaginationItem>
          ))}
          <PaginationItem>
            <PaginationNext
              href='#'
              onClick={(e) => {
                e.preventDefault();
                handlePageChange(currentPage + 1);
              }}
              aria-disabled={currentPage >= totalPages}
              className={
                currentPage >= totalPages
                  ? 'pointer-events-none opacity-50'
                  : ''
              }
            />
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    );
  };

  const handleSongDeleted = (deletedId: string) => {
    setAllSongs((prevSongs) =>
      prevSongs.filter((song) => song.id !== deletedId)
    );
  };

  const handleSongUpdated = (songId: string) => {
    loadSongs(); // For now, just reload all songs to get updated state
  };

  if (authLoading) {
    return <LoadingSkeleton />;
  }

  const isAnonymous = !user || user.isAnonymous;

  const searchInput = (
    <div className='relative w-full flex items-center gap-2 group'>
      <SearchIcon className='absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2  pointer-events-none' />
      <Input
        name='search-lib'
        id='search-lib'
        type='search'
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder={'Search your library...'}
        className='w-full rounded-full border py-2 pl-8 text-bas placeholder:font-medium font-medium'
      />
      <span
        className={cn(
          'cursor-pointer text-green-600 transition-all duration-300 whitespace-nowrap overflow-hidden pr-4',
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

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className='space-y-2'>
          <Skeleton className='h-16 w-full' />
          <Skeleton className='h-16 w-full' />
          <Skeleton className='h-16 w-full' />
        </div>
      );
    }
    if (isAnonymous) {
      return (
        <div className='flex flex-col justify-center items-center h-full text-center'>
          <p className='text-muted-foreground max-w-xs mx-auto mb-4'>
            {commonT('unlockDesc')}
          </p>
          <Button onClick={signInWithGoogle} className='mt-4'>
            <GoogleIcon className='mr-2 h-5 w-5' />
            {commonT('signInGoogle')}
          </Button>
        </div>
      );
    }

    if (allSongs.length > 0) {
      return filteredSongs.length > 0 ? (
        <div className='space-y-4'>
          <div className='flex flex-col space-y-1'>
            {songsOnPage.map((song) => (
              <SongListItem
                key={song.id}
                song={song}
                onDelete={handleSongDeleted}
                onUpdate={handleSongUpdated}
              />
            ))}
          </div>
          {renderPagination()}
        </div>
      ) : (
        <EmptyState
          icon={SearchIcon}
          title='No Results Found'
          description='No songs matched your search for'
          searchTerm={searchTerm}
        />
      );
    } else {
      return (
        <div className='text-center py-16 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full'>
          <Music className='h-12 w-12 text-muted-foreground mb-4' />
          <h2 className='text-xl font-headline font-semibold'>
            Your Library is Empty
          </h2>
          <p className='text-muted-foreground'>
            Create a song or find songs in Search to add to your library.
          </p>
          <Button variant='link' asChild>
            <LocalsLink href='/search'>Find songs to add</LocalsLink>
          </Button>
        </div>
      );
    }
  };

  return (
    <>
      <div className='flex-grow flex flex-col'>
        <header className='sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
          <div className='container mx-auto flex h-16 items-center justify-between px-4'>
            <div className='flex items-center gap-2'>
              <Library className='h-6 w-6' />
              <h1 className='text-2xl font-bold font-headline tracking-tight'>
                Library
              </h1>
            </div>
            {!isAnonymous && (
              <Button variant='ghost' size='icon' asChild>
                <LocalsLink href='/song-editor'>
                  <PlusCircle className='h-6 w-6' />
                  <span className='sr-only'>Add new song</span>
                </LocalsLink>
              </Button>
            )}
          </div>
        </header>

        <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
          <div className='space-y-8'>
            {!isAnonymous && (
              <div className='relative w-full'>{searchInput}</div>
            )}
            {renderContent()}
          </div>
        </main>
        <Footer />
        <BottomNavBar />
      </div>
    </>
  );
}

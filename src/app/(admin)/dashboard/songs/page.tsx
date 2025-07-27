// src/app/admin/songs/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getPaginatedSystemSongs, deleteCloudSong } from '@/lib/db';
import type { Song } from '@/lib/songs';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { PlusCircle, ListMusic, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { SongList } from '@/components/admin';
import { EmptyState, SearchInput, LoadingSkeleton } from '@/components/shared';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

const PAGE_SIZE = 10;

export default function AdminSongsPage() {
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  const loadSongs = useCallback(
    async (page: number) => {
      setIsLoading(true);
      try {
        const { songs: fetchedSongs, totalPages: newTotalPages } =
          await getPaginatedSystemSongs(page, PAGE_SIZE);

        setSongs(fetchedSongs);
        setTotalPages(newTotalPages);
        setCurrentPage(page);
      } catch {
        toast({
          title: 'Error',
          description: 'Could not fetch songs.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    },
    [toast]
  );

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isSuperAdmin) {
        router.replace('/');
      } else {
        loadSongs(1);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isSuperAdmin, authLoading, router]);

  const filteredSongs = useMemo(() => {
    if (!searchTerm) {
      return songs;
    }
    // Note: Search is only performed on the current page of songs.
    // For a full database search, a different approach is needed.
    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [songs, searchTerm]);

  const handleDelete = async (songToDelete: Song) => {
    try {
      await deleteCloudSong(songToDelete.id);
      toast({
        title: 'Song Deleted',
        description: `"${songToDelete.title}" has been removed from the cloud.`,
      });
      // Refresh the current page
      loadSongs(currentPage);
    } catch {
      toast({
        title: 'Error',
        description: 'Could not delete the song.',
        variant: 'destructive',
      });
    }
  };

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      loadSongs(page);
    }
  };

  if (authLoading || !user || !isSuperAdmin) {
    return <LoadingSkeleton />;
  }

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

  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
        <div className='space-y-8'>
          <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
            <h1 className='text-3xl font-bold font-headline'>
              System Song Database
            </h1>
            <Button asChild>
              <Link href='/song-editor?mode=cloud'>
                <PlusCircle className='mr-2 h-4 w-4' />
                Create New Song
              </Link>
            </Button>
          </div>

          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder='Search loaded songs...'
          />

          {isLoading ? (
            <div className='space-y-2'>
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-16 w-full' />
            </div>
          ) : songs.length > 0 || searchTerm ? (
            <div className='space-y-6'>
              {filteredSongs.length > 0 ? (
                <section>
                  <SongList songs={filteredSongs} onDelete={handleDelete} />
                </section>
              ) : (
                <EmptyState
                  icon={Search}
                  title='No Results Found'
                  description='No songs matched your search for'
                  searchTerm={searchTerm}
                />
              )}
              {!searchTerm && renderPagination()}
            </div>
          ) : (
            <EmptyState
              icon={ListMusic}
              title='No Cloud Songs Found'
              description='The cloud database is empty.'
            />
          )}
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

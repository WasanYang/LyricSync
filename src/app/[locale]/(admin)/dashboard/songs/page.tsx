// src/app/admin/songs/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { deleteCloudSong } from '@/lib/db';
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
import { useToast } from '@/hooks/use-toast';
import LocalsLink from '@/components/ui/LocalsLink';
import { useSearchCloudSongsMutation } from '@/store/songApi';

const PAGE_SIZE = 10;

export default function AdminSongsPage() {
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  // const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [searchCloudSongs, { error, isLoading }] =
    useSearchCloudSongsMutation();

  const handleDelete = async (songToDelete: Song) => {
    try {
      await deleteCloudSong(songToDelete.id);
      toast({
        title: 'Song Deleted',
        description: `"${songToDelete.title}" has been removed from the cloud.`,
      });
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
      setCurrentPage(page);
    }
  };

  if (authLoading || !user || !isSuperAdmin) {
    return <LoadingSkeleton />;
  }
  useEffect(() => {
    if (error) {
      toast({
        title: 'Error',
        description: 'Could not search songs.',
        variant: 'destructive',
      });
    }
  }, [error, toast]);

  useEffect(() => {
    searchCloudSongs({
      pagination: { pageIndex: currentPage - 1, pageSize: PAGE_SIZE },
      sorting: [],
      columnFilters: [],
    }).then((res) => {
      if ('data' in res && res.data && Array.isArray(res.data.songs)) {
        setAllSongs(res.data.songs);
        setTotalPages(Math.ceil(res.data.totalCount / PAGE_SIZE));
      }
    });
  }, [searchCloudSongs, currentPage]);

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
              <LocalsLink href='/song-editor?mode=cloud'>
                <PlusCircle className='mr-2 h-4 w-4' />
                Create New Song
              </LocalsLink>
            </Button>
          </div>

          {/* <SearchInput
            value={searchTerm}
            onChange={(val) => {
              setSearchTerm(val);
              setCurrentPage(1); // Reset page on new search
            }}
            placeholder='Search all songs...'
          /> */}

          {isLoading ? (
            <div className='space-y-2'>
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-16 w-full' />
            </div>
          ) : allSongs.length > 0 ? (
            <div className='space-y-6'>
              {allSongs.length > 0 ? (
                <section>
                  <SongList songs={allSongs} onDelete={handleDelete} />
                </section>
              ) : (
                <EmptyState
                  icon={Search}
                  title='No Results Found'
                  description='No songs matched your search for'
                  // searchTerm={searchTerm}
                />
              )}
              {renderPagination()}
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

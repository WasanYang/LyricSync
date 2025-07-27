'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAllCloudSongs } from '@/lib/db';
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
import { Search, Music } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { UserUploadsList } from '@/components/admin';
import { EmptyState, SearchInput } from '@/components/shared';
import { useToast } from '@/hooks/use-toast';

function LoadingSkeleton() {
  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
        <div className='space-y-6'>
          <div className='flex justify-between items-center'>
            <Skeleton className='h-8 w-64' />
          </div>
          <Skeleton className='h-10 w-full' />
          <div className='space-y-2'>
            <Skeleton className='h-16 w-full' />
            <Skeleton className='h-16 w-full' />
            <Skeleton className='h-16 w-full' />
            <Skeleton className='h-16 w-full' />
          </div>
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

const PAGE_SIZE = 10;

export default function AdminUserUploadsPage() {
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const loadSongs = useCallback(async () => {
    setIsLoading(true);
    try {
      const cloudSongs = await getAllCloudSongs();
      // Filter to only show songs uploaded by users
      const userUploadedSongs = cloudSongs.filter(
        (s: Song) => s.source === 'user'
      );
      setSongs(userUploadedSongs);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not fetch user uploads.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isSuperAdmin) {
        router.replace('/');
      } else {
        loadSongs();
      }
    }
  }, [user, isSuperAdmin, authLoading, router, loadSongs]);

  const filteredSongs = useMemo(() => {
    if (!searchTerm) return songs;
    return songs.filter(
      (song) =>
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.uploaderName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.uploaderEmail?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [songs, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredSongs.length / PAGE_SIZE);
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedSongs = filteredSongs.slice(
    startIndex,
    startIndex + PAGE_SIZE
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
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
              User Song Uploads
            </h1>
          </div>

          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder='Search by title, artist, or uploader...'
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
                  <UserUploadsList songs={paginatedSongs} />
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
              icon={Music}
              title='No User Uploads Found'
              description='No users have uploaded any songs to the cloud yet.'
            />
          )}
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

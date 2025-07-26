
// src/app/admin/songs/page.tsx
'use client';

import { useState, useEffect, useMemo, useCallback }from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getPaginatedCloudSongs, deleteCloudSong } from '@/lib/db';
import type { Song } from '@/lib/songs';
import { Button } from '@/components/ui/button';
import { PlusCircle, ListMusic, Search, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { SongList } from '@/components/admin';
import { EmptyState, SearchInput, LoadingSkeleton } from '@/components/shared';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { DocumentSnapshot, DocumentData } from 'firebase/firestore';

const PAGE_SIZE = 15;

export default function AdminSongsPage() {
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadSongs = useCallback(async (loadMore = false) => {
    if (loadMore) {
        setIsLoadingMore(true);
    } else {
        setIsLoading(true);
    }

    try {
        const result = await getPaginatedCloudSongs(PAGE_SIZE, loadMore ? lastVisible : undefined);
        const systemSongs = result.songs.filter((s) => s.source === 'system');
        
        setSongs(prevSongs => loadMore ? [...prevSongs, ...systemSongs] : systemSongs);
        setLastVisible(result.lastVisible);
        setHasMore(result.songs.length === PAGE_SIZE);
    } catch (error) {
        toast({
            title: 'Error',
            description: 'Could not fetch songs.',
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
        setIsLoadingMore(false);
    }
  }, [lastVisible, toast]);

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isSuperAdmin) {
        router.replace('/');
      } else {
        loadSongs();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, isSuperAdmin, authLoading, router]);

  const filteredSongs = useMemo(() => {
    if (!searchTerm) {
        return songs;
    }
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
      // Refresh the list
      setSongs((prevSongs) =>
        prevSongs.filter((s) => s.id !== songToDelete.id)
      );
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not delete the song.',
        variant: 'destructive',
      });
    }
  };

  if (authLoading || !user || !isSuperAdmin) {
    return <LoadingSkeleton />;
  }

  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
        <div className='space-y-8'>
          <div className='flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4'>
            <h1 className='text-3xl font-bold font-headline'>
              Manage Cloud Songs
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
               {hasMore && !searchTerm && (
                    <div className="text-center">
                        <Button onClick={() => loadSongs(true)} disabled={isLoadingMore}>
                            {isLoadingMore ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Loading...
                                </>
                            ) : (
                                'Load More'
                            )}
                        </Button>
                    </div>
                )}
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

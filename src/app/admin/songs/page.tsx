// src/app/admin/songs/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getAllCloudSongs, deleteCloudSong } from '@/lib/db';
import type { Song } from '@/lib/songs';
import { Button } from '@/components/ui/button';
import { PlusCircle, ListMusic, Search } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { SongList } from '@/components/admin';
import { EmptyState, SearchInput, LoadingSkeleton } from '@/components/shared';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function AdminSongsPage() {
  const { user, isSuperAdmin, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [songs, setSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  async function loadSongs() {
    setIsLoading(true);
    const cloudSongs = await getAllCloudSongs();
    // Filter to only show system songs
    const systemSongs = cloudSongs.filter((s) => s.source === 'system');
    setSongs(systemSongs);
    setIsLoading(false);
  }

  useEffect(() => {
    if (!authLoading) {
      if (!user || !isSuperAdmin) {
        router.replace('/');
      } else {
        loadSongs();
      }
    }
  }, [user, isSuperAdmin, authLoading, router]);

  const filteredSongs = useMemo(() => {
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
            placeholder='Search songs...'
          />

          {isLoading ? (
            <div className='space-y-2'>
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

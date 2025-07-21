
'use client'

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllSavedSongs, deleteSong as deleteSongFromDb, updateSong, type Song, uploadSongToCloud } from '@/lib/db';
import { getSongById } from '@/lib/songs';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { Library, Trash2, Edit, RefreshCw, UploadCloud, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Skeleton } from '@/components/ui/skeleton';

function SongListItem({ song, onDelete, onUpdate }: { song: Song, onDelete: (songId: string) => void, onUpdate: (songId: string) => void }) {
  const { user, isSuperAdmin } = useAuth();
  const isCustomSong = song.id.startsWith('custom-');
  const { toast } = useToast();
  
  const handleDelete = async () => {
    try {
        await deleteSongFromDb(song.id);
        onDelete(song.id);
        toast({
            title: `Song "${song.title}" deleted.`,
        });
    } catch (error) {
        toast({
            title: "Error",
            description: "Could not delete the song.",
            variant: "destructive"
        });
    }
  }

  const handleUpdate = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const latestSong = getSongById(song.id);
    if (!latestSong) {
      toast({
        title: "Error",
        description: "Could not find the latest version of this song.",
        variant: "destructive",
      });
      return;
    }
    try {
      await updateSong(latestSong);
      onUpdate(latestSong.id);
      toast({
        title: "Song Updated",
        description: `"${latestSong.title}" has been updated.`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not update the song.",
        variant: "destructive",
      });
    }
  }

  const handleUpload = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await uploadSongToCloud(song);
      toast({
        title: "Song Uploaded",
        description: `"${song.title}" has been uploaded to the cloud.`
      });
      // Optionally, you might want to refresh the list or change the song's state
    } catch (error) {
       toast({
        title: "Upload Error",
        description: error instanceof Error ? error.message : "Could not upload song.",
        variant: "destructive"
       })
    }
  }

  return (
    <div className={cn("flex items-center space-x-3")}>
      <Link href={`/lyrics/${song.id}`} className="flex-grow flex items-center space-x-3 min-w-0 p-2 rounded-lg transition-colors hover:bg-muted group">
        <Image
          src={`https://placehold.co/80x80.png?text=${encodeURIComponent(song.title)}`}
          alt={`${song.title} album art`}
          width={40}
          height={40}
          className="rounded-md aspect-square object-cover"
          data-ai-hint="album cover"
        />
        <div className="min-w-0">
          <p className="font-semibold font-headline truncate">{song.title}</p>
          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
          {song.updatedAt && (
            <p className="text-xs text-muted-foreground/80 truncate">
              Updated: {new Date(song.updatedAt).toLocaleString()}
            </p>
          )}
        </div>
      </Link>
      <div className="flex-shrink-0 flex items-center gap-1">
        {isCustomSong ? (
             <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <Link href={`/song-editor?id=${song.id}`} onClick={e => e.stopPropagation()}>
                      <Edit className="h-4 w-4" />
                  </Link>
              </Button>
        ) : (
          !isSuperAdmin ? (
            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={handleUpdate}>
                <RefreshCw className="h-4 w-4" />
            </Button>
          ) : (
             <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                  <Link href={`/song-editor?id=${song.id}&cloud=true`} onClick={e => e.stopPropagation()}>
                      <Edit className="h-4 w-4" />
                  </Link>
              </Button>
          )
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete "{song.title}" from your library.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}

export default function DownloadedPage() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/welcome');
    }
  }, [user, authLoading, router]);

  async function loadSongs() {
    setIsLoading(true);
    const loadedSongs = await getAllSavedSongs();
    setSongs(loadedSongs);
    setIsLoading(false);
  }

  useEffect(() => {
    if (user) {
        loadSongs();
    }
  }, [user]);

  const handleSongDeleted = (deletedId: string) => {
    setSongs(prevSongs => prevSongs.filter(song => song.id !== deletedId));
  }
  
  const handleSongUpdated = (updatedId: string) => {
    // Re-fetch the songs to get the updated list
    loadSongs();
  }
  
  if (authLoading || !user) {
    return (
       <div className="flex-grow flex flex-col">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
             <div className="space-y-4">
               <Skeleton className="h-8 w-48" />
               <div className="space-y-2">
                 <Skeleton className="h-12 w-full" />
                 <Skeleton className="h-12 w-full" />
                 <Skeleton className="h-12 w-full" />
               </div>
             </div>
          </main>
          <BottomNavBar />
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-headline font-bold tracking-tight">Library</h1>
                <Button variant="ghost" size="icon" asChild>
                    <Link href="/song-editor">
                        <PlusCircle className="h-6 w-6" />
                        <span className="sr-only">Add new song</span>
                    </Link>
                </Button>
            </div>


          {isLoading ? (
            <p>Loading songs...</p>
          ) : songs.length > 0 ? (
            <div className="flex flex-col space-y-1">
              {songs.map(song => (
                <SongListItem key={song.id} song={song} onDelete={handleSongDeleted} onUpdate={handleSongUpdated} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full">
                <Library className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-headline font-semibold">Your Library is Empty</h2>
                <p className="text-muted-foreground">You haven't saved any songs for offline use yet.</p>
                <Button variant="link" asChild>
                    <Link href="/search">Find songs to add</Link>
                </Button>
            </div>
          )}
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

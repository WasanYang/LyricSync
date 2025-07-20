
'use client'

import { useState, useEffect } from 'react';
import { getAllSavedSongs, deleteSong as deleteSongFromDb, type Song } from '@/lib/db';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import Image from 'next/image';
import Link from 'next/link';
import SongStatusButton from '@/components/SongStatusButton';
import { cn } from '@/lib/utils';
import { DownloadCloud, Trash2, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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

function SongListItem({ song, onDelete }: { song: Song, onDelete: (songId: string) => void }) {
  const isCustomSong = song.id.startsWith('custom-');
  const { toast } = useToast();
  
  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
        await deleteSongFromDb(song.id);
        onDelete(song.id);
        toast({
            title: "Song Deleted",
            description: `"${song.title}" has been removed from your downloads.`
        });
    } catch (error) {
        toast({
            title: "Error",
            description: "Could not delete the song.",
            variant: "destructive"
        });
    }
  }

  return (
    <div className={cn(
      "flex items-center space-x-3 p-2 rounded-lg transition-colors",
      "hover:bg-accent hover:text-accent-foreground group"
    )}>
      <Link href={`/lyrics/${song.id}`} className="flex-grow flex items-center space-x-3 min-w-0">
        <Image
          src={`https://placehold.co/80x80.png?text=${encodeURIComponent(song.title)}`}
          alt={`${song.title} album art`}
          width={32}
          height={32}
          className="rounded-md aspect-square object-cover"
          data-ai-hint="album cover"
        />
        <div className="min-w-0">
          <p className="font-semibold font-headline truncate">{song.title}</p>
          <p className="text-sm text-muted-foreground truncate">{song.artist}</p>
        </div>
      </Link>
      <div className="flex-shrink-0 flex items-center gap-1">
        {isCustomSong ? (
            <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-primary">
                <Link href={`/song-editor?id=${song.id}`} onClick={e => e.stopPropagation()}>
                    <Edit className="h-4 w-4" />
                </Link>
            </Button>
        ) : (
            <SongStatusButton song={song} />
        )}
        <AlertDialog>
          <AlertDialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => e.preventDefault()}>
                <Trash2 className="h-4 w-4" />
              </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete "{song.title}" from your downloaded songs.
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

  useEffect(() => {
    async function loadSongs() {
      setIsLoading(true);
      const loadedSongs = await getAllSavedSongs();
      setSongs(loadedSongs);
      setIsLoading(false);
    }
    loadSongs();
  }, []);

  const handleSongDeleted = (deletedId: string) => {
    setSongs(prevSongs => prevSongs.filter(song => song.id !== deletedId));
  }

  return (
    <div className="flex-grow flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="space-y-8">
          <h1 className="text-4xl font-headline font-bold tracking-tight">Downloaded Songs</h1>

          {isLoading ? (
            <p>Loading songs...</p>
          ) : songs.length > 0 ? (
            <div className="flex flex-col">
              {songs.map(song => (
                <SongListItem key={song.id} song={song} onDelete={handleSongDeleted} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full">
                <DownloadCloud className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-headline font-semibold">No Downloaded Songs</h2>
                <p className="text-muted-foreground">You haven&apos;t saved any songs for offline use.</p>
                <Button variant="link" asChild>
                    <Link href="/search">Find songs to download</Link>
                </Button>
            </div>
          )}
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

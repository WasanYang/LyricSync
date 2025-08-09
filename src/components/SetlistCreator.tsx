// src/components/SetlistCreator.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { Song } from '@/lib/songs';
import {
  saveSetlist,
  getSetlist as getSetlistFromDb,
  getAllCloudSongs,
  getCloudSongById,
} from '@/lib/db';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  GripVertical,
  PlusCircle,
  Search,
  Trash2,
  ArrowLeft,
  Edit,
  Cloud,
  User as UserIcon,
  LogIn,
  Download,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { v4 as uuidv4 } from 'uuid';
import { Skeleton } from './ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';
import SongStatusButton from './SongStatusButton';
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
} from '@/components/ui/alert-dialog';
import Link from 'next/link';

const setlistFormSchema = z.object({
  title: z.string().min(1, 'Setlist title is required.'),
});

type SetlistFormValues = z.infer<typeof setlistFormSchema>;

interface SetlistCreatorProps {
  setlistId?: string;
}

function LoadingScreen() {
  return (
    <div className='w-full max-w-lg mx-auto h-full flex flex-col space-y-8'>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-3/4' />
      </div>
      <div className='flex-grow space-y-4 flex flex-col'>
        <div className='flex justify-between items-center'>
          <Skeleton className='h-7 w-24' />
          <Skeleton className='h-9 w-9' />
        </div>
        <div className='flex-grow'>
          <div className='text-center py-10 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full'>
            <Skeleton className='h-5 w-48 mb-2' />
            <Skeleton className='h-4 w-40' />
          </div>
        </div>
      </div>
      <Skeleton className='h-11 w-full' />
    </div>
  );
}

function AddSongComponent({
  availableSongs,
  onAddSong,
  searchTerm,
  onSearchTermChange,
}: {
  availableSongs: Song[];
  onAddSong: (song: Song) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
}) {
  const getSourceIcon = (song: Song) => {
    if (song.source === 'system') {
      return <Cloud className='h-3 w-3 text-muted-foreground' />;
    }
    if (song.source === 'user') {
      return <UserIcon className='h-3 w-3 text-muted-foreground' />;
    }
    return null;
  };

  return (
    <>
      <div className='p-4'>
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground' />
          <Input
            placeholder='Search songs...'
            className='pl-9'
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className='h-[300px]'>
        <div className='p-4 pt-0'>
          {availableSongs.length > 0 ? (
            availableSongs.map((song) => (
              <div
                key={song.id}
                className='flex items-center justify-between p-2 rounded-md hover:bg-accent group'
              >
                <button
                  onClick={() => onAddSong(song)}
                  className='flex-grow text-left flex items-start min-w-0'
                >
                  <div className='min-w-0'>
                    <div className='flex items-center gap-2'>
                      <p className='font-semibold text-sm truncate'>
                        {song.title}
                      </p>
                      {getSourceIcon(song)}
                    </div>
                    <div className='flex items-center gap-2 text-xs text-muted-foreground truncate'>
                      <span>
                        {song.artist} • Key: {song.originalKey || 'N/A'}
                      </span>
                      {typeof song.downloadCount === 'number' && (
                        <div className='flex items-center gap-1'>
                          <Download className='h-3 w-3' />
                          <span>{song.downloadCount}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </button>
                <div
                  onClick={(e) => e.stopPropagation()}
                  className='flex-shrink-0'
                >
                  <SongStatusButton song={song} />
                </div>
              </div>
            ))
          ) : (
            <p className='text-sm text-center text-muted-foreground py-4'>
              No songs found.
            </p>
          )}
        </div>
      </ScrollArea>
    </>
  );
}

export default function SetlistCreator({ setlistId }: SetlistCreatorProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const router = useRouter();

  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isMobile = useIsMobile();

  const form = useForm<SetlistFormValues>({
    resolver: zodResolver(setlistFormSchema),
    defaultValues: {
      title: '',
    },
  });

  const {
    formState: { isDirty },
  } = form;

  useEffect(() => {
    const fetchAllSongs = async () => {
      if (!user) return;
      const cloudSongs = await getAllCloudSongs();
      setAllSongs(cloudSongs);
    };
    fetchAllSongs();
  }, [user]);

  useEffect(() => {
    const fetchSetlistData = async () => {
      if (!setlistId) {
        setIsLoading(false);
        return;
      }

      // Ensure songs are loaded before fetching the setlist
      if (allSongs.length === 0) return;

      setIsLoading(true);
      try {
        const existingSetlist = await getSetlistFromDb(setlistId);
        if (existingSetlist) {
          form.reset({ title: existingSetlist.title });

          // Create a Map for efficient lookup of all available songs.
          const allAvailableSongsMap = new Map(
            allSongs.map((s) => [s.id, s])
          );

          // Map song IDs from the setlist to the full song objects.
          const songPromises = existingSetlist.songIds.map(async (id) => {
            if (allAvailableSongsMap.has(id)) {
              return allAvailableSongsMap.get(id);
            }
            // Fallback: If the song isn't in our pre-loaded lists, fetch it directly from the cloud.
            console.warn(
              `Song ${id} not found in pre-loaded list, fetching from cloud.`
            );
            return await getCloudSongById(id);
          });

          const loadedSongs = (await Promise.all(songPromises)).filter(
            Boolean
          ) as Song[];
          setSelectedSongs(loadedSongs);
        } else {
          toast({
            title: 'Setlist not found',
            description: 'The requested setlist could not be found.',
            variant: 'destructive',
          });
          router.push('/setlists');
        }
      } catch (error) {
        console.error('Error fetching setlist data', error);
        toast({
          title: 'Error',
          description: 'Failed to load setlist data.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchSetlistData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setlistId, allSongs]); // Depend on songs being loaded.

  const availableSongs = useMemo(() => {
    const filterBySearchTerm = (song: Song) =>
      song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      song.artist.toLowerCase().includes(searchTerm.toLowerCase());

    return allSongs
      .filter(
        (song) => !selectedSongs.some((selected) => selected.id === song.id)
      )
      .filter((song) => !searchTerm || filterBySearchTerm(song));
  }, [allSongs, selectedSongs, searchTerm]);

  const addSong = (song: Song) => {
    setSelectedSongs((prev) => [...prev, song]);
    form.trigger('title'); // Mark form as dirty when songs change
  };

  const handleAddSong = (song: Song) => {
    addSong(song);
    if (isMobile) {
      setIsPopoverOpen(false);
    }
  };

  const removeSong = (songId: string) => {
    setSelectedSongs((prev) => prev.filter((song) => song.id !== songId));
    form.trigger('title');
  };

  const handleDragStart = (
    e: React.DragEvent<HTMLLIElement>,
    index: number
  ) => {
    e.dataTransfer.setData('songIndex', index.toString());
  };

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, dropIndex: number) => {
    e.preventDefault();
    const dragIndex = parseInt(e.dataTransfer.getData('songIndex'), 10);
    const draggedSong = selectedSongs[dragIndex];
    const newSongs = [...selectedSongs];
    newSongs.splice(dragIndex, 1);
    newSongs.splice(dropIndex, 0, draggedSong);
    setSelectedSongs(newSongs);
    e.currentTarget.classList.remove('border-primary', 'border-2');
    form.trigger('title');
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-primary', 'border-2');
  };

  const handleDragLeave = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary', 'border-2');
  };

  const handleGoBack = () => {
    router.back();
  };

  async function handleSaveSetlist(data: SetlistFormValues) {
    if (!user || user.isAnonymous) {
      toast({
        title: 'Please login',
        description: 'You must be logged in to save a setlist.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedSongs.length === 0) {
      toast({
        title: 'Empty Setlist',
        description: 'Please add at least one song to the setlist.',
        variant: 'destructive',
      });
      return;
    }

    const isEditing = !!setlistId;

    const existingSetlist = isEditing
      ? await getSetlistFromDb(setlistId)
      : null;

    const newSetlist = {
      id: existingSetlist?.id || uuidv4(),
      firestoreId: existingSetlist?.firestoreId || null,
      isSynced: existingSetlist?.isSynced || false,
      createdAt: existingSetlist?.createdAt || Date.now(),
      updatedAt: Date.now(),
      title: data.title,
      songIds: selectedSongs.map((s) => s.id),
      userId: user.uid,
      source: existingSetlist?.source || 'owner',
      authorName:
        existingSetlist?.authorName || user.displayName || 'Anonymous',
      isPublic: existingSetlist?.isPublic || false,
      syncedAt: existingSetlist?.syncedAt,
    };

    try {
      await saveSetlist(newSetlist);

      toast({
        title: `Setlist ${isEditing ? 'Updated' : 'Saved'}`,
        description: `"${data.title}" has been successfully saved.`,
      });

      if (isEditing) {
        // After updating, reset the form with the new data to make it "not dirty"
        form.reset({ title: newSetlist.title });
        // The selectedSongs state is already up-to-date
      } else {
        router.push('/setlists');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not save the setlist.',
        variant: 'destructive',
      });
      console.error('Failed to save setlist:', error);
    }
  }

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (user && user.isAnonymous) {
    return (
      <div className='text-center py-16 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full'>
        <LogIn className='h-12 w-12 text-muted-foreground mb-4' />
        <h2 className='text-xl font-headline font-semibold'>Please Sign In</h2>
        <p className='text-muted-foreground'>
          You need to sign in to create a setlist.
        </p>
        <Button variant='link' asChild className='mt-2'>
          <Link href='/login'>Sign In</Link>
        </Button>
      </div>
    );
  }

  const BackButton = () => {
    if (isDirty) {
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant='ghost' size='icon'>
              <ArrowLeft className='h-5 w-5' />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Discard changes?</AlertDialogTitle>
              <AlertDialogDescription>
                You have unsaved changes. Are you sure you want to discard them
                and go back?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Keep Editing</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleGoBack}
                className='bg-destructive hover:bg-destructive/90'
              >
                Discard
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      );
    }
    return (
      <Button variant='ghost' size='icon' onClick={handleGoBack}>
        <ArrowLeft className='h-5 w-5' />
      </Button>
    );
  };

  const addSongTrigger = (
    <Button variant='ghost' size='icon'>
      <PlusCircle className='h-5 w-5' />
    </Button>
  );

  const addSongContent = (
    <AddSongComponent
      availableSongs={availableSongs}
      onAddSong={handleAddSong}
      searchTerm={searchTerm}
      onSearchTermChange={setSearchTerm}
    />
  );

  const getSourceIcon = (song: Song) => {
    if (song.source === 'system') {
      return <Cloud className='h-3 w-3 text-muted-foreground flex-shrink-0' />;
    }
    if (song.source === 'user') {
      return (
        <UserIcon className='h-3 w-3 text-muted-foreground flex-shrink-0' />
      );
    }
    return null;
  };

  return (
    <div className='relative w-full max-w-lg mx-auto'>
      <div className='absolute top-1 -left-1 z-10'>
        <BackButton />
      </div>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(handleSaveSetlist)}
          className='w-full h-full flex flex-col space-y-8'
        >
          <div className='space-y-2 pt-2 text-center'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem className='group relative'>
                  <FormLabel className='sr-only'>Setlist Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Setlist Name'
                      {...field}
                      className='text-xl text-center font-bold p-0 h-auto border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent'
                    />
                  </FormControl>
                  <Edit className='absolute top-1/2 right-0 -translate-y-1/2 h-4 w-4 text-muted-foreground/0 group-hover:text-muted-foreground/70 transition-colors' />
                  <FormMessage className='text-center' />
                </FormItem>
              )}
            />
          </div>

          <div className='flex-grow space-y-4 flex flex-col'>
            <div className='flex justify-between items-center'>
              <h2 className='text-lg font-semibold font-headline'>
                Songs ({selectedSongs.length})
              </h2>
              {isMobile ? (
                <Drawer open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <DrawerTrigger asChild>{addSongTrigger}</DrawerTrigger>
                  <DrawerContent>
                    <DrawerHeader className='p-0'>
                      <DrawerTitle className='sr-only'>Add a song</DrawerTitle>
                    </DrawerHeader>
                    {addSongContent}
                  </DrawerContent>
                </Drawer>
              ) : (
                <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                  <PopoverTrigger asChild>{addSongTrigger}</PopoverTrigger>
                  <PopoverContent
                    className='w-[350px] p-0'
                    align='end'
                    onInteractOutside={(e) => {
                      const target = e.target as HTMLElement;
                      if (target.closest('[data-radix-toast-provider]')) {
                        e.preventDefault();
                      }
                    }}
                  >
                    {addSongContent}
                  </PopoverContent>
                </Popover>
              )}
            </div>

            <div className='flex-grow min-h-[200px]'>
              {selectedSongs.length > 0 ? (
                <ul className='space-y-2'>
                  {selectedSongs.map((song, index) => (
                    <li
                      key={song.id}
                      className='flex items-center p-2 rounded-md bg-muted/50 transition-all border-2 border-transparent'
                      draggable
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      <GripVertical className='h-5 w-5 text-muted-foreground cursor-grab mr-2' />
                      <div className='flex-grow min-w-0'>
                        <div className='flex items-center gap-2'>
                          <p className='font-semibold truncate'>{song.title}</p>
                          {getSourceIcon(song)}
                        </div>
                        <p className='text-sm text-muted-foreground truncate'>
                          {song.artist} • Key: {song.originalKey || 'N/A'}
                        </p>
                      </div>
                      <Button
                        variant='ghost'
                        size='icon'
                        onClick={() => removeSong(song.id)}
                        className='text-muted-foreground hover:text-destructive h-8 w-8'
                      >
                        <Trash2 className='h-4 w-4' />
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className='text-center py-10 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full'>
                  <p className='text-muted-foreground'>
                    Your setlist is empty.
                  </p>
                  <p className='text-sm text-muted-foreground'>
                    Add songs to get started.
                  </p>
                </div>
              )}
            </div>
          </div>

          <Button type='submit' size='lg' className='w-full'>
            {setlistId ? 'Update Setlist' : 'Save Setlist'}
          </Button>
        </form>
      </Form>
    </div>
  );
}

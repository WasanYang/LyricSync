// src/components/SongEditorV2/SongCreatorV2.tsx
'use client';

import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { saveSong, getCloudSongById } from '@/lib/db';
import type { Song } from '@/lib/songs';
import { ALL_NOTES } from '@/lib/chords';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Textarea } from '@/components/ui/textarea';
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
} from '@/components/ui/alert-dialog';
import { LyricPlayerV2 } from '@/components/LyricPlayerV2/LyricPlayerV2';
import { Play, Save, ArrowLeft, Expand, LogIn } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { LyricsHelpDialogV2 } from './LyricsHelpDialogV2';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import LocalsLink from '../ui/LocalsLink';
import LyricPlayer from '../LyricPlayer';

const songFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  artist: z.string(),
  lyrics: z.string().min(1, 'Lyrics are required.'),
  originalKey: z.string().min(1, 'Key is required'),
});

type SongFormValues = z.infer<typeof songFormSchema>;

const formatLyricsToString = (lyrics: any[] | string): string => {
  // This needs to be adapted to the new simple format if we are to edit old songs.
  // For now, we assume a simple text field.
  if (typeof lyrics === 'string') return lyrics;
  if (Array.isArray(lyrics)) {
    // A simple conversion for viewing, might not be perfect for editing.
    return lyrics.map((line) => line.text || '').join('\n');
  }
  return '';
};

function LoadingScreen() {
  return (
    <div className='flex flex-col h-full'>
      <header className='flex-shrink-0 p-4 border-b bg-background flex items-center justify-between'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-9 w-28' />
      </header>
      <div className='flex-grow overflow-y-auto p-4 md:p-6 pb-24 w-full max-w-2xl mx-auto space-y-6'>
        {/* Simplified skeleton */}
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-10 w-1/2' />
        <Skeleton className='h-64 w-full flex-grow' />
      </div>
    </div>
  );
}

const parseLyricsFromString = (lyricString: string): any[] => {
  return lyricString
    .split('\n')
    .map((line) => {
      // Basic logic to assign measures if a line doesn't start with a number
      if (!/^\d+\s*\|/.test(line)) {
        return { measures: 4, text: line }; // Default to 4 measures
      }
      const parts = line.split('|');
      const measures = parseInt(parts[0].trim(), 10);
      const text = parts.slice(1).join('|').trim();
      return { measures: isNaN(measures) ? 4 : measures, text };
    })
    .filter((line) => line.measures > 0 || line.text !== '');
};

export default function SongCreatorV2() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const songId = searchParams.get('id');

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user } = useAuth();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<SongFormValues>({
    resolver: zodResolver(songFormSchema),
    defaultValues: {
      title: '',
      artist: '',
      lyrics: '',
      originalKey: 'C',
    },
  });

  const adjustTextareaHeight = useCallback(
    (element: HTMLTextAreaElement | null) => {
      if (element) {
        element.style.height = 'auto';
        element.style.height = `${element.scrollHeight}px`;
      }
    },
    []
  );

  useEffect(() => {
    if (textareaRef.current) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, [form.watch('lyrics'), adjustTextareaHeight]);

  useEffect(() => {
    if (songId) {
      setIsLoading(true);
      const fetchSong = async () => {
        try {
          const existingSong = await getCloudSongById(songId);
          if (existingSong) {
            form.reset({
              title: existingSong.title,
              artist: existingSong.artist,
              lyrics: formatLyricsToString(existingSong.lyrics),
              originalKey: existingSong.originalKey || 'C',
            });
            setTimeout(() => adjustTextareaHeight(textareaRef.current), 0);
          } else {
            toast({
              title: 'Song not found',
              variant: 'destructive',
            });
            router.push('/library');
          }
        } catch (error) {
          toast({ title: 'Error loading song', variant: 'destructive' });
        } finally {
          setIsLoading(false);
        }
      };
      fetchSong();
    } else {
      setIsLoading(false);
    }
  }, [songId, form, router, toast, adjustTextareaHeight]);

  const {
    formState: { isDirty },
  } = form;

  const formData = form.watch();

  const previewSong: Song = useMemo(
    () => ({
      id: songId || 'preview',
      title: formData.title || 'Untitled',
      artist: formData.artist || 'Unknown Artist',
      lyrics: parseLyricsFromString(formData.lyrics), // Convert to V1 format for V1 player
      originalKey: formData.originalKey,
      bpm: 120, // Add default BPM for preview
      timeSignature: '4/4', // Add default time signature
      source: 'user',
      updatedAt: Date.now(),
    }),
    [formData, songId]
  );

  async function handleSaveSong(data: SongFormValues) {
    if (!user || user.isAnonymous) {
      toast({ title: 'Please Sign In', variant: 'destructive' });
      return;
    }

    const newSongData: Omit<Song, 'lyrics' | 'updatedAt'> & {
      lyrics: any;
      updatedAt: any;
    } = {
      id: songId || uuidv4(),
      title: data.title,
      artist: data.artist,
      lyrics: data.lyrics, // Storing as a single string now
      originalKey: data.originalKey,
      userId: user.uid,
      uploaderName: user.displayName,
      source: 'user',
    };

    try {
      await saveSong(newSongData as Song);
      toast({ title: `Song ${songId ? 'Updated' : 'Saved'}` });
      if (songId) {
        form.reset(data);
      } else {
        router.push('/library');
      }
    } catch (error) {
      toast({ title: 'Error saving song', variant: 'destructive' });
    }
  }

  if (isLoading) return <LoadingScreen />;

  if (user && user.isAnonymous) {
    return (
      <div className='flex flex-col h-full items-center justify-center p-4 text-center'>
        <LogIn className='h-12 w-12 text-muted-foreground mb-4' />
        <h2 className='text-xl font-headline font-semibold'>Please Sign In</h2>
        <Button variant='link' asChild className='mt-2'>
          <LocalsLink href='/login'>Sign In</LocalsLink>
        </Button>
      </div>
    );
  }

  return (
    <div className='relative h-screen flex flex-col'>
      <Form {...form}>
        <form
          id='song-creator-form'
          onSubmit={form.handleSubmit(handleSaveSong)}
          className='flex flex-col h-full'
        >
          <header className='flex-shrink-0 p-4 border-b bg-background flex items-center justify-between gap-4 z-10'>
            <div className='flex items-center gap-2'>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type='button'
                    variant='ghost'
                    size='icon'
                    disabled={!isDirty}
                  >
                    <ArrowLeft className='h-5 w-5' />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Discard changes?</AlertDialogTitle>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={() => router.back()}
                      className='bg-destructive hover:bg-destructive/90'
                    >
                      Discard
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <h1 className='text-xl font-bold font-headline truncate'>
                {songId ? 'Edit Song' : 'Add New Song'}
              </h1>
            </div>
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogTrigger asChild>
                <Button type='button' variant='outline'>
                  <Play className='mr-2 h-4 w-4' /> Preview
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-full w-full h-screen max-h-screen p-0 m-0 border-0 flex flex-col bg-white text-black'>
                <DialogHeader className='sr-only'>
                  <DialogTitle>Song Preview</DialogTitle>
                </DialogHeader>
                <LyricPlayer
                  song={previewSong}
                  onClose={() => setIsPreviewOpen(false)}
                />
              </DialogContent>
            </Dialog>
          </header>

          <div className='flex-grow flex flex-col overflow-y-auto p-4 md:p-6 pb-24'>
            <div className='w-full max-w-2xl mx-auto flex flex-col space-y-6 flex-grow'>
              <FormField
                control={form.control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Song Title</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter song title' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='artist'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Artist Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Enter artist name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='originalKey'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Original Key</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ALL_NOTES.map((note) => (
                          <SelectItem key={note} value={note}>
                            {note}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='lyrics'
                render={({ field }) => (
                  <FormItem className='flex flex-col flex-grow'>
                    <div className='flex items-center justify-between'>
                      <FormLabel>Lyrics &amp; Chords</FormLabel>
                      <LyricsHelpDialogV2 />
                    </div>
                    <FormControl>
                      <Textarea
                        ref={textareaRef}
                        placeholder={'(Verse 1)\n[C]Lyrics and [G]chords go here...'}
                        className='text-base font-mono resize-none overflow-y-auto flex-grow min-h-[24rem]'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
          <div className='sticky bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t z-10'>
            <div className='w-full max-w-2xl mx-auto flex items-center justify-end'>
              <Button type='submit' size='lg'>
                <Save className='mr-2 h-4 w-4' /> Save
              </Button>
            </div>
          </div>
        </form>
      </Form>
    </div>
  );
}

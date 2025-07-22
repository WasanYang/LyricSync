// src/components/SongCreator.tsx
'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';
import {
  saveSong,
  getSong as getSongFromDb,
  uploadSongToCloud,
  getCloudSongById,
} from '@/lib/db';
import type { Song, LyricLine } from '@/lib/songs';
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
import LyricPlayer from './LyricPlayer';
import {
  Eye,
  Save,
  XCircle,
  HelpCircle,
  Database,
  ArrowLeft,
  Expand,
  Shrink,
} from 'lucide-react';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';


const songFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  artist: z.string().min(1, 'Artist is required.'),
  lyrics: z.string().min(1, 'Lyrics are required.'),
  originalKey: z.string().min(1, 'Key is required'),
  bpm: z.coerce
    .number()
    .min(20, 'BPM must be at least 20')
    .max(300, 'BPM must be at most 300')
    .optional(),
  timeSignature: z.string().optional(),
});

type SongFormValues = z.infer<typeof songFormSchema>;

const parseLyricsFromString = (lyricString: string): LyricLine[] => {
  return lyricString
    .split('\n')
    .map((line) => {
      const parts = line.split('|');
      // If there's no '|', treat the whole line as text with 0 measures
      if (parts.length < 2) {
        return { measures: 0, text: line.trim() };
      }
      const measures = parseInt(parts[0].trim(), 10);
      const text = parts.slice(1).join('|').trim();
      return { measures: isNaN(measures) ? 0 : measures, text };
    })
    .filter((line) => line.measures > 0 || line.text !== ''); // Keep section headers or lines with measures
};

const formatLyricsToString = (lyrics: LyricLine[]): string => {
  return lyrics.map((line) => `${line.measures} | ${line.text}`).join('\n');
};

const TIME_SIGNATURES = [
  '4/4',
  '3/4',
  '2/4',
  '6/8',
  '2/2',
  '3/2',
  '5/4',
  '7/4',
  '12/8',
];

function LoadingScreen() {
  return (
    <div className='flex flex-col h-full'>
      <header className='flex-shrink-0 p-4 border-b bg-background flex items-center justify-between'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-9 w-28' />
      </header>
      <div className='flex-grow overflow-y-auto p-4 md:p-6 pb-24 w-full max-w-2xl mx-auto space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-1/3' />
            <Skeleton className='h-10 w-full' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-1/3' />
            <Skeleton className='h-10 w-full' />
          </div>
        </div>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-1/3' />
            <Skeleton className='h-8 w-full' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-1/3' />
            <Skeleton className='h-10 w-full' />
          </div>
          <div className='space-y-2'>
            <Skeleton className='h-4 w-1/3' />
            <Skeleton className='h-8 w-full' />
          </div>
        </div>
        <div className='space-y-2 flex-grow flex flex-col'>
          <Skeleton className='h-4 w-1/4' />
          <Skeleton className='h-64 w-full' />
        </div>
      </div>
      <div className='flex-shrink-0 sticky bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t'>
        <div className='w-full max-w-2xl mx-auto flex items-center justify-end'>
          <Skeleton className='h-11 w-32' />
        </div>
      </div>
    </div>
  );
}

export default function SongCreator() {
  const { toast } = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const songId = searchParams.get('id');
  const mode = searchParams.get('mode'); // 'cloud' or null
  const isMobile = useIsMobile();

  const isCloudMode = mode === 'cloud';
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { user, isSuperAdmin } = useAuth();

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isLyricsFullscreen, setIsLyricsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<SongFormValues>({
    resolver: zodResolver(songFormSchema),
    defaultValues: {
      title: '',
      artist: '',
      lyrics: '',
      originalKey: 'C',
      bpm: 120,
      timeSignature: '4/4',
    },
  });

  const adjustTextareaHeight = (element: HTMLTextAreaElement | null) => {
    if (element) {
      element.style.height = 'auto'; // Reset height
      element.style.height = `${element.scrollHeight}px`; // Set to scroll height
    }
  };

  useEffect(() => {
    // Re-adjust on lyrics change, but only if not in fullscreen
    if (!isLyricsFullscreen) {
      adjustTextareaHeight(textareaRef.current);
    }
  }, [form.watch('lyrics'), isLyricsFullscreen]);

  useEffect(() => {
    // If it's cloud mode but user isn't an admin, redirect.
    if (isCloudMode && !isSuperAdmin) {
      router.replace('/');
      return;
    }

    if (songId) {
      setIsLoading(true);
      const fetchSong = async () => {
        try {
          const existingSong = isCloudMode
            ? await getCloudSongById(songId)
            : await getSongFromDb(songId);

          if (existingSong) {
            form.reset({
              title: existingSong.title,
              artist: existingSong.artist,
              lyrics: formatLyricsToString(existingSong.lyrics),
              originalKey: existingSong.originalKey || 'C',
              bpm: existingSong.bpm || 120,
              timeSignature: existingSong.timeSignature || '4/4',
            });
            setTimeout(() => adjustTextareaHeight(textareaRef.current), 0);
          } else {
            toast({
              title: 'Song not found',
              description: 'The requested song could not be found.',
              variant: 'destructive',
            });
            router.push(isCloudMode ? '/admin/songs' : '/library');
          }
        } catch (error) {
           toast({
            title: 'Error loading song',
            description: 'There was a problem fetching the song data.',
            variant: 'destructive',
          });
          console.error("Failed to fetch song:", error);
        } finally {
            setIsLoading(false);
        }
      };
      fetchSong();
    } else {
      setIsLoading(false);
    }
  }, [songId, isCloudMode, isSuperAdmin, form, router, toast]);

  const {
    formState: { isDirty },
  } = form;

  const formData = form.watch();

  const previewSong: Song = useMemo(
    () => ({
      id: songId || 'preview',
      title: formData.title || 'Untitled',
      artist: formData.artist || 'Unknown Artist',
      updatedAt: new Date(),
      lyrics: parseLyricsFromString(formData.lyrics || ''),
      originalKey: formData.originalKey,
      bpm: formData.bpm,
      timeSignature: formData.timeSignature,
      source: isCloudMode ? 'system' : 'user',
    }),
    [formData, songId, isCloudMode]
  );

  async function handleSaveSong(data: SongFormValues) {
    if (!user) return;

    const isCloudAction = isCloudMode && isSuperAdmin;
    const isUpdating = !!songId;

    const newSongData: Omit<Song, 'updatedAt'> & { updatedAt: Date | any } = {
      id: isUpdating ? songId : uuidv4(),
      title: data.title,
      artist: data.artist,
      lyrics: parseLyricsFromString(data.lyrics),
      originalKey: data.originalKey,
      bpm: data.bpm,
      timeSignature: data.timeSignature,
      userId: user.uid,
      uploaderName: user.displayName,
      uploaderEmail: user.email,
      source: isCloudAction ? 'system' : 'user',
    };

    if (isCloudAction) {
      try {
        await uploadSongToCloud(newSongData as Song);
        toast({
          title: `Song Saved`,
          description: `"${newSongData.title}" has been saved to the cloud.`,
        });
        form.reset(data); // Reset form to make it not dirty
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Could not save the song to the cloud.',
          variant: 'destructive',
        });
      }
    } else {
      // Regular user saving to local IndexedDB
      try {
        const localSong = {
          ...newSongData,
          id: isUpdating ? songId : `custom-${uuidv4()}`,
          source: 'user', // Local custom songs are always from user
          updatedAt: new Date(),
        } as Song;
        await saveSong(localSong);
        toast({
          title: `Song Saved`,
          description: `"${localSong.title}" has been saved to your local library.`,
        });
        form.reset(data); // Reset form to make it not dirty
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Could not save the song.',
          variant: 'destructive',
        });
        console.error('Failed to save song:', error);
      }
    }
  }

  const handleCancel = () => {
    router.back();
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  const getPageTitle = () => {
    if (isSuperAdmin && isCloudMode) {
      return songId ? 'Edit Cloud Song' : 'Create Cloud Song';
    }
    return songId ? 'Edit Song' : 'Create Custom Song';
  };

  const getSubmitButton = () => {
    if (isSuperAdmin && isCloudMode) {
      return (
        <Button type='submit' form='song-creator-form' size='lg'>
          <Database className='mr-2 h-4 w-4' />
          Save
        </Button>
      );
    }
    return (
      <Button type='submit' form='song-creator-form' size='lg'>
        <Save className='mr-2 h-4 w-4' />
        Save
      </Button>
    );
  };

  const CancelButton = () => {
    if (isDirty) {
      return (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button type='button' variant='ghost' size='icon'>
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
                onClick={handleCancel}
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
      <Button type='button' variant='ghost' size='icon' onClick={handleCancel}>
        <ArrowLeft className='h-5 w-5' />
      </Button>
    );
  };

  return (
    <div className="relative h-full flex flex-col">
       {/* Fullscreen Lyrics Editor Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-20 transition-opacity duration-300 pointer-events-none',
          isLyricsFullscreen ? 'opacity-100 bg-black/80' : 'opacity-0'
        )}
        onClick={() => setIsLyricsFullscreen(false)}
      />

      <Form {...form}>
        <div className={cn('flex flex-col h-full')}>
          <header className={cn('flex-shrink-0 p-4 border-b bg-background flex items-center justify-between gap-4 z-10', isLyricsFullscreen ? 'opacity-0 h-0 p-0 border-0' : 'h-auto')}>
            <div className='flex items-center gap-2'>
              <CancelButton />
              <h1 className='text-xl md:text-2xl font-bold font-headline truncate'>
                {getPageTitle()}
              </h1>
            </div>
            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
              <DialogTrigger asChild>
                <Button type='button' variant='outline'>
                  <Eye className='mr-2 h-4 w-4' /> Preview
                </Button>
              </DialogTrigger>
              <DialogContent className='max-w-full w-full h-screen max-h-screen p-0 m-0 border-0 flex flex-col'>
                <DialogHeader className='sr-only'>
                  <DialogTitle>Song Preview</DialogTitle>
                </DialogHeader>
                <div className='relative w-full h-full flex-grow bg-background'>
                  <LyricPlayer
                    song={previewSong}
                    onClose={() => setIsPreviewOpen(false)}
                  />
                </div>
              </DialogContent>
            </Dialog>
          </header>

          <div className={cn('flex-grow flex flex-col overflow-y-auto transition-all duration-300', isLyricsFullscreen ? '' : 'p-4 md:p-6 pb-24')}>
            <form
              id='song-creator-form'
              onSubmit={form.handleSubmit(handleSaveSong)}
              className={cn('w-full max-w-2xl mx-auto flex flex-col space-y-6', isLyricsFullscreen ? 'opacity-0 h-0 overflow-hidden' : 'h-auto')}
            >
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
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
              </div>

              <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                <FormField
                  control={form.control}
                  name='originalKey'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Original Key</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select a key' />
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
                  name='bpm'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>BPM</FormLabel>
                      <FormControl>
                        <Input
                          type='number'
                          placeholder='120'
                          {...field}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10) || 0)
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='timeSignature'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Signature</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Select a time signature' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {TIME_SIGNATURES.map((sig) => (
                            <SelectItem key={sig} value={sig}>
                              {sig}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
               <div className='opacity-0 h-0'>
                  {/* This is a hidden dummy field to prevent the lyrics field from stealing focus. */}
              </div>
            </form>

            {/* Lyrics Form Field - rendered outside the form flow for positioning */}
            <FormField
              control={form.control}
              name='lyrics'
              render={({ field }) => (
                <FormItem
                  className={cn(
                    'flex flex-col relative transition-all duration-300 w-full',
                    isLyricsFullscreen
                      ? 'fixed bottom-0 left-0 right-0 z-30 h-[70vh] bg-background border-t'
                      : 'flex-grow min-h-0',
                    isMobile && !isLyricsFullscreen && 'flex-grow min-h-[300px]'
                  )}
                >
                  <div className={cn('flex items-center justify-between gap-2', isLyricsFullscreen ? 'absolute -top-10 right-1 z-10' : 'mb-2')}>
                    <FormLabel className={cn(isLyricsFullscreen ? 'text-background/70' : 'text-foreground')}>Lyrics &amp; Chords</FormLabel>
                    <div className='flex items-center gap-1'>
                      <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              type='button'
                              variant='ghost'
                              size='icon'
                              className={cn('h-5 w-5', isLyricsFullscreen ? 'text-background/70 hover:text-background' : 'text-muted-foreground')}
                            >
                              <HelpCircle className='h-4 w-4' />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className='sm:max-w-2xl'>
                            <DialogHeader>
                              <DialogTitle>
                                How to Format Lyrics & Chords
                              </DialogTitle>
                              <p className='text-sm text-muted-foreground'>
                                Follow this format to ensure your lyrics and chords
                                display correctly in the player.
                              </p>
                            </DialogHeader>
                            <div className='space-y-4 text-sm py-4'>
                              <p>
                                Each line must start with a number representing the number of measures (ห้อง), followed by
                                a pipe `|`, and then the text content.
                              </p>
                              <div className='p-4 bg-muted rounded-md font-mono text-xs overflow-x-auto'>
                                <p className='font-bold mb-2'>Format:</p>
                                <p>
                                  <code className='text-primary'>num_of_measures</code> |{' '}
                                  <code className='text-primary'>[Chord]</code>Lyric
                                  text...
                                </p>
                              </div>

                              <div>
                                <h4 className='font-semibold mb-2'>
                                  Key Concepts:
                                </h4>
                                <ul className='list-disc pl-5 space-y-2'>
                                  <li>
                                    <strong>Number of Measures:</strong> Every line must
                                    begin with a number representing how many measures/bars that line of lyric should last.
                                  </li>
                                  <li>
                                    <strong>Line Duration:</strong> A line with `0` measures will be combined with the previous line and not advance the timeline. Use this for multi-line lyrics within the same set of measures.
                                  </li>
                                  <li>
                                    <strong>Pipe Separator:</strong> A pipe
                                    character `|` must follow the number to
                                    separate it from the content.
                                  </li>
                                  <li>
                                    <strong>Chords:</strong> Enclose chords in
                                    square brackets, like{' '}
                                    <code className='bg-muted px-1 py-0.5 rounded'>
                                      [C]
                                    </code>{' '}
                                    or{' '}
                                    <code className='bg-muted px-1 py-0.5 rounded'>
                                      [G/B]
                                    </code>
                                    . Place them right before the syllable where the
                                    chord change occurs.
                                  </li>
                                  <li>
                                    <strong>Section Headers:</strong> To define
                                    sections like (Intro), (Verse), or (Chorus), use
                                    `0` for the number of measures.
                                  </li>
                                </ul>
                              </div>

                              <div className='p-4 bg-muted rounded-md font-mono text-xs overflow-x-auto'>
                                <p className='font-bold mb-2'>Examples:</p>
                                <p>0 | (Intro)</p>
                                <p>4 | [Am] [G] [C] [F]</p>
                                <p>4 | [C]This is a [G]line with chords.</p>
                                <p>4 | This is a line with no chords.</p>
                                <p>0 | (Verse 1)</p>
                                <p>
                                  4 | The quick [Am]brown fox [G]jumps over the
                                  [C]lazy dog.[F]
                                </p>
                                 <p>
                                  0 | This is the second line of lyrics for the 4 measures above.
                                </p>
                              </div>
                            </div>
                          </DialogContent>
                      </Dialog>
                      <Button
                          type='button'
                          variant='ghost'
                          size='icon'
                          onClick={() => setIsLyricsFullscreen(!isLyricsFullscreen)}
                          className={cn('h-5 w-5', isLyricsFullscreen ? 'text-background/70 hover:text-background' : 'text-muted-foreground')}
                      >
                          {isLyricsFullscreen ? <Shrink className='h-4 w-4' /> : <Expand className='h-4 w-4'/>}
                      </Button>
                    </div>
                  </div>
                  <FormControl>
                    <Textarea
                      ref={textareaRef}
                      placeholder='4 | [C]Lyrics for the first four measures...'
                      className={cn(
                        'text-sm font-mono resize-none overflow-y-auto transition-all duration-300 w-full',
                         isLyricsFullscreen 
                          ? 'h-full bg-zinc-900 text-background border-zinc-700 focus-visible:ring-offset-zinc-900 focus-visible:ring-primary rounded-lg p-4' 
                          : 'min-h-full md:flex-grow'
                      )}
                       onInput={(e) => {
                          if (!isLyricsFullscreen) {
                            adjustTextareaHeight(e.currentTarget);
                          }
                       }}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className={cn(isLyricsFullscreen ? 'absolute bottom-4 left-4' : '')}/>
                </FormItem>
              )}
            />

          </div>

          <div className={cn('sticky bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t z-10', isLyricsFullscreen ? 'opacity-0 h-0 p-0 border-0' : 'h-auto')}>
            <div className='w-full max-w-2xl mx-auto flex items-center justify-end gap-4'>
              {getSubmitButton()}
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
}

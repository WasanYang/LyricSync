// src/components/SongCreator.tsx
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { saveSong } from '@/lib/db';
import type { Song, LyricLine } from '@/lib/songs';
import { ALL_NOTES } from '@/lib/chords';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import LyricPlayer from './LyricPlayer';
import { Eye, Save, XCircle } from 'lucide-react';

const songFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  artist: z.string().min(1, 'Artist is required.'),
  lyrics: z.string().min(1, 'Lyrics are required.'),
  originalKey: z.string().min(1, "Key is required"),
  bpm: z.coerce.number().min(20, "BPM must be at least 20").max(300, "BPM must be at most 300").optional(),
  timeSignature: z.string().optional(),
});

type SongFormValues = z.infer<typeof songFormSchema>;

const parseLyricsFromString = (lyricString: string): LyricLine[] => {
  return lyricString
    .split('\n')
    .map(line => line.trim())
    // .filter(line => line) // Allow empty lines for spacing
    .map(line => {
      if (line === '') {
          return { time: 0, text: '' };
      }
      const parts = line.split('|');
      if (parts.length < 2) {
        return { time: 0, text: line };
      }
      const time = parseFloat(parts[0].trim());
      const text = parts.slice(1).join('|').trim();
      return { time: isNaN(time) ? 0 : time, text };
    })
    .sort((a, b) => a.time - b.time);
};

const TIME_SIGNATURES = ["4/4", "3/4", "2/4", "6/8", "2/2", "3/2", "5/4", "7/4", "12/8"];

const lyricsPlaceholder = `Enter your lyrics here...`;

export default function SongCreator() {
  const { toast } = useToast();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const form = useForm<SongFormValues>({
    resolver: zodResolver(songFormSchema),
    defaultValues: {
      title: '',
      artist: '',
      lyrics: '',
      originalKey: 'C',
      bpm: 120,
      timeSignature: '4/4'
    },
  });

  const formData = form.watch();

  const previewSong: Song = useMemo(() => ({
    id: 'preview',
    title: formData.title || 'Untitled',
    artist: formData.artist || 'Unknown Artist',
    updatedAt: new Date(),
    lyrics: parseLyricsFromString(formData.lyrics || ''),
    originalKey: formData.originalKey,
    bpm: formData.bpm,
    timeSignature: formData.timeSignature,
  }), [formData]);

  async function handleSaveSong(data: SongFormValues) {
    const newSong: Song = {
      id: `custom-${Date.now().toString()}`,
      title: data.title,
      artist: data.artist,
      updatedAt: new Date(),
      lyrics: parseLyricsFromString(data.lyrics),
      originalKey: data.originalKey,
      bpm: data.bpm,
      timeSignature: data.timeSignature,
    };

    try {
      await saveSong(newSong);
      toast({
        title: 'Song Saved',
        description: `"${newSong.title}" has been saved successfully.`,
      });
      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not save the song.',
        variant: 'destructive',
      });
      console.error('Failed to save song:', error);
    }
  }

  return (
    <Form {...form}>
      <div className="flex flex-col h-full">
          <header className="flex-shrink-0 p-4 border-b bg-background flex items-center justify-between">
              <h1 className="text-2xl font-bold font-headline">Song Creator</h1>
              <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                  <DialogTrigger asChild>
                      <Button type="button" variant="outline">
                          <Eye className="mr-2 h-4 w-4" /> Preview
                      </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-full w-full h-screen max-h-screen p-0 m-0 border-0 flex flex-col">
                      <DialogHeader className="sr-only">
                          <DialogTitle>Song Preview</DialogTitle>
                      </DialogHeader>
                      <div className="relative w-full h-full flex-grow bg-background">
                          <LyricPlayer song={previewSong} onClose={() => setIsPreviewOpen(false)} />
                      </div>
                  </DialogContent>
              </Dialog>
          </header>

          <div className="flex-grow overflow-y-auto">
              <form id="song-creator-form" onSubmit={form.handleSubmit(handleSaveSong)} className="p-4 md:p-6 pb-24 w-full max-w-2xl mx-auto flex flex-col space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Song Title</FormLabel>
                          <FormControl>
                              <Input placeholder="Enter song title" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                      <FormField
                      control={form.control}
                      name="artist"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>Artist Name</FormLabel>
                          <FormControl>
                              <Input placeholder="Enter artist name" {...field} />
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                          control={form.control}
                          name="originalKey"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Original Key</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                          <SelectTrigger>
                                              <SelectValue placeholder="Select a key" />
                                          </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                          {ALL_NOTES.map(note => <SelectItem key={note} value={note}>{note}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                      <FormField
                      control={form.control}
                      name="bpm"
                      render={({ field }) => (
                          <FormItem>
                          <FormLabel>BPM</FormLabel>
                          <FormControl>
                              <Input type="number" placeholder="120" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10))}/>
                          </FormControl>
                          <FormMessage />
                          </FormItem>
                      )}
                      />
                      <FormField
                          control={form.control}
                          name="timeSignature"
                          render={({ field }) => (
                              <FormItem>
                                  <FormLabel>Time Signature</FormLabel>
                                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                                      <FormControl>
                                          <SelectTrigger>
                                              <SelectValue placeholder="Select a time signature" />
                                          </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                          {TIME_SIGNATURES.map(sig => <SelectItem key={sig} value={sig}>{sig}</SelectItem>)}
                                      </SelectContent>
                                  </Select>
                                  <FormMessage />
                              </FormItem>
                          )}
                      />
                  </div>

                  <FormField
                  control={form.control}
                  name="lyrics"
                  render={({ field }) => (
                      <FormItem className="flex-grow flex flex-col">
                      <FormLabel>Lyrics & Chords</FormLabel>
                      <FormControl>
                          <Textarea
                          placeholder={lyricsPlaceholder}
                          className="flex-grow text-sm font-mono resize-none h-64"
                          {...field}
                          />
                      </FormControl>
                      <p className="text-xs text-muted-foreground mt-2">
                          Format: <code className="bg-muted px-1 py-0.5 rounded">time | [Chord]Lyric text</code>.
                          <br/>
                          Example: <code className="bg-muted px-1 py-0.5 rounded">0 | (Intro)</code>, <code className="bg-muted px-1 py-0.5 rounded">2 | [Am] [G] [C] [F]</code>, <code className="bg-muted px-1 py-0.5 rounded">15 | [C]This is a [G]line.</code>
                      </p>
                      <FormMessage />
                      </FormItem>
                  )}
                  />
              </form>
          </div>

          <div className="flex-shrink-0 sticky bottom-0 left-0 right-0 p-4 bg-background/95 backdrop-blur-sm border-t">
              <div className="w-full max-w-2xl mx-auto flex items-center justify-between gap-4">
                  <Button type="button" variant="ghost" asChild>
                      <Link href="/">
                        <XCircle className="mr-2 h-4 w-4"/> Cancel
                      </Link>
                  </Button>

                  <Button type="submit" form="song-creator-form" size="lg">
                    <Save className="mr-2 h-4 w-4" /> Save Song
                  </Button>
              </div>
            </div>
      </div>
    </Form>
  );
}

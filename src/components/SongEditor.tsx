
// src/components/SongEditor.tsx
'use client';

import { useState, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { saveSong } from '@/lib/db';
import type { Song, LyricLine } from '@/lib/songs';

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
import { Eye, Save } from 'lucide-react';

const lyricLineSchema = z.object({
  time: z.number().min(0),
  text: z.string(),
});

const songFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  artist: z.string().min(1, 'Artist is required.'),
  lyrics: z.string().min(1, 'Lyrics are required.'),
});

type SongFormValues = z.infer<typeof songFormSchema>;

const parseLyricsFromString = (lyricString: string): LyricLine[] => {
  return lyricString
    .split('\n')
    .map(line => line.trim())
    .filter(line => line)
    .map(line => {
      const parts = line.split('|');
      if (parts.length < 2) {
        // Assume it's a line without a timestamp for simplicity
        return { time: 0, text: line };
      }
      const time = parseFloat(parts[0].trim());
      const text = parts.slice(1).join('|').trim();
      return { time: isNaN(time) ? 0 : time, text };
    })
    .sort((a, b) => a.time - b.time);
};

export default function SongEditor() {
  const { toast } = useToast();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const form = useForm<SongFormValues>({
    resolver: zodResolver(songFormSchema),
    defaultValues: {
      title: '',
      artist: '',
      lyrics: '',
    },
  });

  const formData = form.watch();

  const previewSong: Song = useMemo(() => ({
    id: 'preview',
    title: formData.title || 'Untitled',
    artist: formData.artist || 'Unknown Artist',
    updatedAt: new Date(),
    lyrics: parseLyricsFromString(formData.lyrics || ''),
  }), [formData]);

  async function handleSaveSong(data: SongFormValues) {
    const newSong: Song = {
      id: `custom-${Date.now().toString()}`,
      title: data.title,
      artist: data.artist,
      updatedAt: new Date(),
      lyrics: parseLyricsFromString(data.lyrics),
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
      <form onSubmit={form.handleSubmit(handleSaveSong)} className="w-full max-w-2xl mx-auto h-full flex flex-col space-y-6">
        <h1 className="text-3xl font-bold font-headline">Song Editor</h1>
        
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

        <FormField
          control={form.control}
          name="lyrics"
          render={({ field }) => (
            <FormItem className="flex-grow flex flex-col">
              <FormLabel>Lyrics & Chords</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter lyrics with timestamps and chords..."
                  className="flex-grow text-sm font-mono resize-none"
                  {...field}
                />
              </FormControl>
               <p className="text-xs text-muted-foreground mt-2">
                Format: <code className="bg-muted px-1 py-0.5 rounded">time_in_seconds | [Chord]Lyric text</code>. Each line is a new lyric.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex items-center justify-between gap-4">
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
                    <LyricPlayer song={previewSong} />
                </div>
            </DialogContent>
          </Dialog>

          <Button type="submit" size="lg" className="flex-grow">
            <Save className="mr-2 h-4 w-4" /> Save Song
          </Button>
        </div>
      </form>
    </Form>
  );
}

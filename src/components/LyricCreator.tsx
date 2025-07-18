'use client';

import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState, useTransition } from 'react';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { enhanceLyricsAction } from '@/app/actions';
import Metronome from '@/components/Metronome';
import { ArrowDown, Wand2 } from 'lucide-react';

const lyricFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  artist: z.string().min(1, 'Artist is required.'),
  rawLyrics: z.string().min(10, 'Lyrics must be at least 10 characters long.'),
});

type LyricFormValues = z.infer<typeof lyricFormSchema>;

export default function LyricCreator() {
  const [isPending, startTransition] = useTransition();
  const [enhancedLyrics, setEnhancedLyrics] = useState('');
  const { toast } = useToast();

  const form = useForm<LyricFormValues>({
    resolver: zodResolver(lyricFormSchema),
    defaultValues: {
      title: '',
      artist: '',
      rawLyrics: '',
    },
  });

  const rawLyricsValue = useWatch({ control: form.control, name: 'rawLyrics' });

  const handleEnhanceLyrics = () => {
    if (!rawLyricsValue) {
      toast({
        title: 'Error',
        description: 'Please enter some lyrics before enhancing.',
        variant: 'destructive',
      });
      return;
    }

    startTransition(async () => {
      const result = await enhanceLyricsAction({ rawLyrics: rawLyricsValue });
      if (result.error) {
        toast({
          title: 'Enhancement Failed',
          description: result.error,
          variant: 'destructive',
        });
      } else if (result.data) {
        setEnhancedLyrics(result.data.enhancedLyrics);
        toast({
          title: 'Success!',
          description: 'Lyrics have been enhanced with new line breaks.',
        });
      }
    });
  };

  const applyEnhancedLyrics = () => {
    form.setValue('rawLyrics', enhancedLyrics);
    setEnhancedLyrics('');
  };

  function onSubmit(data: LyricFormValues) {
    // Here you would typically save the data to a database
    console.log(data);
    toast({
      title: 'Song Saved (Simulated)',
      description: 'Your song and lyrics have been saved.',
    });
  }

  return (
    <div className="grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Song Details</CardTitle>
                <CardDescription>Enter the song title and artist.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Starlight Echoes" {...field} />
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
                      <FormLabel>Artist</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Celestial Sound" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Raw Lyrics</CardTitle>
                <CardDescription>Paste the raw, un-timed lyrics here.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="rawLyrics"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Textarea
                          placeholder="In the quiet of the night, a single star begins to glow..."
                          className="min-h-[250px] font-body"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            {enhancedLyrics && (
                <Card className="border-primary">
                    <CardHeader>
                        <CardTitle className="font-headline text-primary flex items-center gap-2"><Wand2 size={20}/> AI-Enhanced Layout</CardTitle>
                        <CardDescription>Here are the AI suggested line breaks. Apply them if you're happy with the result.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <pre className="whitespace-pre-wrap p-4 bg-muted rounded-md font-body text-sm">{enhancedLyrics}</pre>
                        <div className="mt-4 flex gap-2">
                           <Button onClick={applyEnhancedLyrics}><ArrowDown className="mr-2 h-4 w-4"/> Apply to Editor</Button>
                           <Button variant="ghost" onClick={() => setEnhancedLyrics('')}>Discard</Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Button type="submit" disabled={isPending}>Save Song</Button>
          </form>
        </Form>
      </div>

      <div className="space-y-8 md:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Tools</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
             <Button onClick={handleEnhanceLyrics} disabled={isPending || !rawLyricsValue} className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                <Wand2 className="mr-2 h-4 w-4" />
                {isPending ? 'Enhancing...' : 'Enhance Layout with AI'}
            </Button>
            <Separator/>
            <Metronome />
          </CardContent>
        </Card>
        
        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Timing Mode</CardTitle>
                <CardDescription>Sync lyrics by tapping to the rhythm.</CardDescription>
            </CardHeader>
            <CardContent className="text-center">
                <p className="text-sm text-muted-foreground mb-4">Timing functionality coming soon!</p>
                <Button disabled>Start Timing</Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

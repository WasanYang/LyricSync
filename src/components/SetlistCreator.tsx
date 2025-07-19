// src/components/SetlistCreator.tsx
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSongs, type Song } from '@/lib/songs';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GripVertical, PlusCircle, Search, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const setlistFormSchema = z.object({
  title: z.string().min(1, 'Setlist title is required.'),
});

type SetlistFormValues = z.infer<typeof setlistFormSchema>;

export default function SetlistCreator() {
  const { toast } = useToast();
  const [selectedSongs, setSelectedSongs] = useState<Song[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  
  const form = useForm<SetlistFormValues>({
    resolver: zodResolver(setlistFormSchema),
    defaultValues: {
      title: '',
    },
  });

  const allSongs = useMemo(() => getSongs(), []);

  const availableSongs = useMemo(() => {
    return allSongs
      .filter(song => !selectedSongs.some(selected => selected.id === song.id))
      .filter(song => 
        song.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        song.artist.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [allSongs, selectedSongs, searchTerm]);

  const addSong = (song: Song) => {
    setSelectedSongs(prev => [...prev, song]);
  };

  const removeSong = (songId: string) => {
    setSelectedSongs(prev => prev.filter(song => song.id !== songId));
  };

  const handleDragStart = (e: React.DragEvent<HTMLLIElement>, index: number) => {
    e.dataTransfer.setData('songIndex', index.toString());
  };

  const handleDrop = (e: React.DragEvent<HTMLLIElement>, dropIndex: number) => {
    const dragIndex = parseInt(e.dataTransfer.getData('songIndex'), 10);
    const draggedSong = selectedSongs[dragIndex];
    const newSongs = [...selectedSongs];
    newSongs.splice(dragIndex, 1);
    newSongs.splice(dropIndex, 0, draggedSong);
    setSelectedSongs(newSongs);
    e.currentTarget.classList.remove('border-primary', 'border-2');
  };

  const handleDragOver = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-primary', 'border-2');
  };
    
  const handleDragLeave = (e: React.DragEvent<HTMLLIElement>) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-primary', 'border-2');
  };


  function onSubmit(data: SetlistFormValues) {
    if (selectedSongs.length === 0) {
      toast({
        title: 'Empty Setlist',
        description: 'Please add at least one song to the setlist.',
        variant: 'destructive',
      });
      return;
    }
    
    console.log({
      title: data.title,
      songs: selectedSongs.map(s => s.id),
    });
    
    toast({
      title: 'Setlist Saved (Simulated)',
      description: `"${data.title}" with ${selectedSongs.length} songs has been saved.`,
    });
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid md:grid-cols-3 gap-8 items-start">
          <div className="md:col-span-2 space-y-8">
            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Setlist Name</CardTitle>
                <CardDescription>Give your setlist a unique name.</CardDescription>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="sr-only">Setlist Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Acoustic Evening" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Songs</CardTitle>
                <CardDescription>Add songs and drag to reorder.</CardDescription>
              </CardHeader>
              <CardContent>
                {selectedSongs.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedSongs.map((song, index) => (
                      <li
                        key={song.id}
                        className="flex items-center p-2 rounded-md bg-muted/50 transition-all"
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDrop={(e) => handleDrop(e, index)}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                      >
                        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab mr-2" />
                        <div className="flex-grow">
                          <p className="font-semibold">{song.title}</p>
                          <p className="text-sm text-muted-foreground">{song.artist}</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeSong(song.id)} className="text-muted-foreground hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">Your setlist is empty.</p>
                    <p className="text-sm text-muted-foreground">Add songs using the button on the right.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8 md:col-span-1">
            <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
              <PopoverTrigger asChild>
                <Button className="w-full">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Add Songs
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <div className="p-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search songs..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
                <ScrollArea className="h-[300px]">
                  <div className="p-4 pt-0">
                  {availableSongs.length > 0 ? (
                    availableSongs.map(song => (
                      <button
                        key={song.id}
                        onClick={() => addSong(song)}
                        className="w-full text-left p-2 rounded-md hover:bg-accent flex items-start"
                      >
                        <div>
                          <p className="font-semibold text-sm">{song.title}</p>
                          <p className="text-xs text-muted-foreground">{song.artist}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-sm text-center text-muted-foreground py-4">No songs found.</p>
                  )}
                  </div>
                </ScrollArea>
              </PopoverContent>
            </Popover>
            <Button type="submit" className="w-full">Save Setlist</Button>
          </div>
        </div>
      </form>
    </Form>
  );
}
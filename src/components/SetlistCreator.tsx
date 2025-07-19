// src/components/SetlistCreator.tsx
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { getSongs, type Song } from '@/lib/songs';
import { saveSetlist } from '@/lib/db';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
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
    e.preventDefault();
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


  async function handleSaveSetlist(data: SetlistFormValues) {
    if (selectedSongs.length === 0) {
      toast({
        title: 'Empty Setlist',
        description: 'Please add at least one song to the setlist.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      await saveSetlist({
        id: Date.now().toString(),
        title: data.title,
        songIds: selectedSongs.map(s => s.id),
      });
      
      toast({
        title: 'Setlist Saved',
        description: `"${data.title}" has been saved successfully.`,
      });

      // Reset form and state
      form.reset();
      setSelectedSongs([]);

    } catch (error) {
       toast({
        title: 'Error',
        description: 'Could not save the setlist.',
        variant: 'destructive',
      });
      console.error('Failed to save setlist:', error);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSaveSetlist)} className="space-y-8 max-w-2xl mx-auto h-full flex flex-col">
        
        <div className="space-y-2">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="sr-only">Setlist Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Setlist Name" {...field} className="text-2xl font-bold p-0 h-auto border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
        </div>

        <div className="flex-grow space-y-4 flex flex-col">
          <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold font-headline">Songs</h2>
              <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <PlusCircle className="h-5 w-5" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[300px] p-0" align="end">
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
                          onClick={() => {
                            addSong(song);
                            setSearchTerm('');
                            setIsPopoverOpen(false);
                          }}
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
          </div>
          
          <div className="flex-grow">
            {selectedSongs.length > 0 ? (
              <ul className="space-y-2">
                {selectedSongs.map((song, index) => (
                  <li
                    key={song.id}
                    className="flex items-center p-2 rounded-md bg-muted/50 transition-all border-2 border-transparent"
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
                    <Button variant="ghost" size="icon" onClick={() => removeSong(song.id)} className="text-muted-foreground hover:text-destructive h-8 w-8">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-10 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full">
                <p className="text-muted-foreground">Your setlist is empty.</p>
                <p className="text-sm text-muted-foreground">Add songs to get started.</p>
              </div>
            )}
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full">Save Setlist</Button>
        
      </form>
    </Form>
  );
}

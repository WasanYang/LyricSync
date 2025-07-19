
'use client';

import { useState, useEffect } from 'react';
import { getSetlists, deleteSetlist, type Setlist } from '@/lib/db';
import { getSongById } from '@/lib/songs';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { Button } from '@/components/ui/button';
import { Trash2, ListMusic } from 'lucide-react';
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
} from "@/components/ui/alert-dialog"

export default function SetlistsPage() {
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function loadSetlists() {
      setIsLoading(true);
      const loadedSetlists = await getSetlists();
      setSetlists(loadedSetlists.reverse());
      setIsLoading(false);
    }
    loadSetlists();
  }, []);
  
  const handleDelete = async (id: string) => {
    try {
        await deleteSetlist(id);
        setSetlists(prev => prev.filter(s => s.id !== id));
        toast({
            title: "Setlist Deleted",
            description: "The setlist has been removed."
        })
    } catch (error) {
        toast({
            title: "Error",
            description: "Could not delete the setlist.",
            variant: "destructive"
        })
    }
  }

  return (
    <div className="flex-grow flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="space-y-8">
          <h1 className="text-4xl font-headline font-bold tracking-tight">My Lists</h1>
          
          {isLoading ? (
             <p>Loading setlists...</p>
          ) : setlists.length > 0 ? (
            <div className="space-y-4">
              {setlists.map(setlist => {
                const songCount = setlist.songIds.length;
                const firstSong = songCount > 0 ? getSongById(setlist.songIds[0]) : null;
                
                return (
                  <div key={setlist.id} className="p-4 rounded-lg bg-muted/50 flex items-center justify-between">
                    <div className="flex-grow">
                      <h2 className="font-headline font-semibold text-lg">{setlist.title}</h2>
                      <p className="text-sm text-muted-foreground">{songCount} songs</p>
                    </div>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive h-8 w-8">
                           <Trash2 className="h-4 w-4" />
                         </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your setlist
                            &quot;{setlist.title}&quot;.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(setlist.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                );
              })}
            </div>
          ) : (
             <div className="text-center py-16 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full">
                <ListMusic className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-headline font-semibold">No Setlists Found</h2>
                <p className="text-muted-foreground">You haven&apos;t created any setlists yet.</p>
                 <Button variant="link" asChild>
                    <a href="/create">Create one now</a>
                </Button>
              </div>
          )}
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

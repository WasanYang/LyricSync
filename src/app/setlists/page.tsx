
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  getSetlists, 
  deleteSetlist as deleteSetlistFromDb,
  syncSetlist,
  unsyncSetlist,
  getSyncedSetlistsCount,
  type SetlistWithSyncStatus
} from '@/lib/db';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { Button } from '@/components/ui/button';
import { Trash2, ListMusic, ChevronRight, UploadCloud, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from '@/lib/utils';
import { MoreVertical } from 'lucide-react';


const SYNC_LIMIT = 5;

function SetlistItem({ setlist, onSetlistChange, onSyncLimitReached }: { setlist: SetlistWithSyncStatus, onSetlistChange: () => void, onSyncLimitReached: () => void }) {
    const { toast } = useToast();
    const { user } = useAuth();

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user) return;
        try {
            await deleteSetlistFromDb(setlist.id, user.uid);
            toast({
                title: "Setlist Deleted",
                description: `"${setlist.title}" has been removed.`
            });
            onSetlistChange();
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not delete the setlist.",
                variant: "destructive"
            });
        }
    };

    const handleSync = async (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (!user) return;

      try {
        await syncSetlist(setlist.id, user.uid);
        toast({
          title: "Setlist Synced",
          description: `"${setlist.title}" is now available online.`,
        });
        onSetlistChange();
      } catch (error: any) {
        if (error.message === 'SYNC_LIMIT_REACHED') {
            onSyncLimitReached();
        } else {
            toast({
                title: "Sync Error",
                description: error.message,
                variant: "destructive",
            });
        }
      }
    };
    
    const handleUnsync = async () => {
        if (!user || !setlist.firestoreId) return;
        try {
            await unsyncSetlist(setlist.id, user.uid, setlist.firestoreId);
            toast({
                title: "Unsynced",
                description: `"${setlist.title}" is no longer synced online.`
            });
            onSetlistChange();
        } catch (error) {
            toast({
                title: "Error",
                description: "Could not unsync the setlist.",
                variant: "destructive"
            });
        }
    }

    const songCount = setlist.songIds.length;
    
    return (
        <div className={cn(
            "p-3 rounded-lg bg-muted/50 flex items-center justify-between transition-colors",
            "hover:bg-muted"
        )}>
            <Link href={`/setlists/${setlist.id}`} key={setlist.id} className="flex-grow flex items-center gap-4 min-w-0">
                 {setlist.isSynced ? (
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                ) : setlist.containsCustomSongs ? (
                    <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" title="Cannot sync setlists with custom songs."/>
                ) : (
                   <ListMusic className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                )}
                <div className="flex-grow min-w-0">
                    <h2 className="font-headline font-semibold text-base truncate">{setlist.title}</h2>
                    <p className="text-sm text-muted-foreground">{songCount} {songCount === 1 ? 'song' : 'songs'}</p>
                </div>
            </Link>
            <div className="flex items-center gap-1">
                {!setlist.isSynced && !setlist.containsCustomSongs && (
                     <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-primary h-8 w-8" onClick={handleSync}>
                       <UploadCloud className="h-4 w-4" />
                     </Button>
                )}
                 <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                         <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8" onClick={(e) => e.preventDefault()}>
                           <MoreVertical className="h-4 w-4" />
                         </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                         {setlist.isSynced && (
                            <DropdownMenuItem onClick={handleUnsync}>
                                Unsync
                            </DropdownMenuItem>
                         )}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                               Delete
                             </DropdownMenuItem>
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
                              <AlertDialogAction onClick={(e) => handleDelete(e)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                 <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
        </div>
    );
}


export default function SetlistsPage() {
  const [setlists, setSetlists] = useState<SetlistWithSyncStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncedCount, setSyncedCount] = useState(0);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
        const [loadedSetlists, count] = await Promise.all([
            getSetlists(user.uid),
            getSyncedSetlistsCount(user.uid)
        ]);
        setSetlists(loadedSetlists.sort((a,b) => b.createdAt - a.createdAt));
        setSyncedCount(count);
    } catch (error) {
        console.error("Failed to load setlist data:", error);
        toast({ title: "Error", description: "Could not load your setlists.", variant: "destructive" });
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    if (!authLoading) {
      if (user) {
        loadData();
      } else {
        // Handle case where user is logged out, maybe redirect or show message
        setIsLoading(false);
        setSetlists([]);
      }
    }
  }, [user, authLoading]);

  const handleSyncLimitReached = () => {
      toast({
          title: "Sync Limit Reached",
          description: `You can only sync up to ${SYNC_LIMIT} setlists online.`,
          variant: "destructive",
      });
  };

  return (
    <div className="flex-grow flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="space-y-8">
            <div>
              <h1 className="text-4xl font-headline font-bold tracking-tight">My Lists</h1>
              {user && <p className="text-muted-foreground">Synced: {syncedCount}/{SYNC_LIMIT}</p>}
            </div>
          
          {isLoading || authLoading ? (
             <p>Loading setlists...</p>
          ) : !user ? (
             <div className="text-center py-16 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full">
                <ListMusic className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-headline font-semibold">Please Login</h2>
                <p className="text-muted-foreground">Login to create and sync your setlists.</p>
                 <Button variant="link" asChild>
                    <Link href="/login">Login Now</Link>
                </Button>
              </div>
          ) : setlists.length > 0 ? (
            <div className="space-y-3">
              {setlists.map(setlist => (
                <SetlistItem 
                    key={setlist.id} 
                    setlist={setlist} 
                    onSetlistChange={loadData}
                    onSyncLimitReached={handleSyncLimitReached}
                />
              ))}
            </div>
          ) : (
             <div className="text-center py-16 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full">
                <ListMusic className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="text-xl font-headline font-semibold">No Setlists Found</h2>
                <p className="text-muted-foreground">You haven&apos;t created any setlists yet.</p>
                 <Button variant="link" asChild>
                    <Link href="/create">Create one now</Link>
                </Button>
              </div>
          )}
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

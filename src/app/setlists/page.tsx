
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { Trash2, ListMusic, ChevronRight, UploadCloud, CheckCircle, AlertTriangle, Edit, RefreshCw, PlusCircle } from 'lucide-react';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';


const SYNC_LIMIT = 5;

function SetlistItem({ setlist, onSetlistChange, onSyncLimitReached }: { setlist: SetlistWithSyncStatus, onSetlistChange: () => void, onSyncLimitReached: () => void }) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isSyncing, setIsSyncing] = useState(false);

    const handleDelete = async () => {
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
      setIsSyncing(true);

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
      } finally {
        setIsSyncing(false);
      }
    };
    
    const handleUnsync = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!user || !setlist.firestoreId) return;
        setIsSyncing(true);
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
        } finally {
            setIsSyncing(false);
        }
    }

    const getStatusIcon = () => {
        let icon: React.ReactNode;
        let tooltipText: string;

        if (setlist.containsCustomSongs) {
            icon = <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />;
            tooltipText = "Cannot sync setlists with custom songs.";
        } else if (setlist.needsSync) {
            icon = <UploadCloud className="h-5 w-5 text-blue-500 flex-shrink-0" />;
            tooltipText = "Changes need to be synced.";
        } else if (setlist.isSynced) {
            icon = <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />;
            tooltipText = "Synced with cloud";
        } else {
            icon = <ListMusic className="h-5 w-5 text-muted-foreground flex-shrink-0" />;
            tooltipText = "Local only";
        }

        return (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="flex items-center">{icon}</span>
              </TooltipTrigger>
              <TooltipContent>
                <p>{tooltipText}</p>
              </TooltipContent>
            </Tooltip>
        );
    };

    const songCount = setlist.songIds.length;
    
    return (
        <div className={cn(
            "p-3 rounded-lg bg-muted/50 flex items-center justify-between transition-colors",
            "hover:bg-muted"
        )}>
            <Link href={`/setlists/${setlist.id}`} key={setlist.id} className="flex-grow flex items-center gap-4 min-w-0">
                {getStatusIcon()}
                <div className="flex-grow min-w-0">
                    <h2 className="font-headline font-semibold text-base truncate">{setlist.title}</h2>
                    <p className="text-sm text-muted-foreground">{songCount} {songCount === 1 ? 'song' : 'songs'}</p>
                </div>
            </Link>
            <div className="flex items-center gap-1 ml-2">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <Button asChild variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                            <Link href={`/create?id=${setlist.id}`} onClick={(e) => e.stopPropagation()}>
                                <Edit className="h-4 w-4" />
                            </Link>
                        </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>Edit</p></TooltipContent>
                </Tooltip>

                 {!setlist.containsCustomSongs && (
                    setlist.isSynced ? (
                        setlist.needsSync ? (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={handleSync} disabled={isSyncing} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                        {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4 text-blue-500" />}
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Sync Changes</p></TooltipContent>
                            </Tooltip>
                        ) : (
                             <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button onClick={handleUnsync} disabled={isSyncing} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent><p>Unsync</p></TooltipContent>
                            </Tooltip>
                        )
                    ) : (
                         <Tooltip>
                            <TooltipTrigger asChild>
                                <Button onClick={handleSync} disabled={isSyncing} variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                    {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent><p>Sync to Cloud</p></TooltipContent>
                        </Tooltip>
                    )
                 )}
                
                <AlertDialog>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-destructive" onClick={(e) => {e.preventDefault(); e.stopPropagation();}}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </AlertDialogTrigger>
                        </TooltipTrigger>
                        <TooltipContent><p>Delete</p></TooltipContent>
                    </Tooltip>
                  <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete your setlist
                        &quot;{setlist.title}&quot;.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => handleDelete()} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
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
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/welcome');
    }
  }, [user, authLoading, router]);

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
        const [loadedSetlists, count] = await Promise.all([
            getSetlists(user.uid),
            getSyncedSetlistsCount(user.uid)
        ]);
        setSetlists(loadedSetlists.sort((a,b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)));
        setSyncedCount(count);
    } catch (error) {
        console.error("Failed to load setlist data:", error);
        toast({ title: "Error", description: "Could not load your setlists.", variant: "destructive" });
    }
    setIsLoading(false);
  };
  
  useEffect(() => {
    if (!authLoading && user) {
        loadData();
    }
  }, [user, authLoading]);

  const handleSyncLimitReached = () => {
      toast({
          title: "Sync Limit Reached",
          description: `You can only sync up to ${SYNC_LIMIT} setlists online.`,
          variant: "destructive",
      });
  };

  if (authLoading || !user) {
     return (
       <div className="flex-grow flex flex-col">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
             <div className="space-y-4">
               <div className="space-y-1">
                  <Skeleton className="h-8 w-36" />
                  <Skeleton className="h-4 w-24" />
               </div>
               <div className="space-y-2 pt-4">
                 <Skeleton className="h-16 w-full" />
                 <Skeleton className="h-16 w-full" />
                 <Skeleton className="h-16 w-full" />
               </div>
             </div>
          </main>
          <BottomNavBar />
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-headline font-bold tracking-tight">Setlists</h1>
                {user && <p className="text-muted-foreground">Synced: {syncedCount}/{SYNC_LIMIT}</p>}
              </div>
              <Button asChild>
                <Link href="/create">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create New
                </Link>
              </Button>
            </div>
          
          {isLoading ? (
             <p>Loading setlists...</p>
          ) : setlists.length > 0 ? (
            <TooltipProvider>
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
            </TooltipProvider>
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

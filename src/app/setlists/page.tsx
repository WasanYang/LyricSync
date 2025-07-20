
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
import { Trash2, ListMusic, ChevronRight, UploadCloud, CheckCircle, AlertTriangle, Edit, RefreshCw } from 'lucide-react';
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from '@/lib/utils';
import { MoreVertical } from 'lucide-react';


const SYNC_LIMIT = 5;

function SetlistItem({ setlist, onSetlistChange, onSyncLimitReached }: { setlist: SetlistWithSyncStatus, onSetlistChange: () => void, onSyncLimitReached: () => void }) {
    const { toast } = useToast();
    const { user } = useAuth();
    const [isSyncing, setIsSyncing] = useState(false);

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
            <div className="flex-grow flex items-center gap-4 min-w-0">
                {getStatusIcon()}
                <Link href={`/setlists/${setlist.id}`} key={setlist.id} className="flex-grow min-w-0">
                    <h2 className="font-headline font-semibold text-base truncate">{setlist.title}</h2>
                    <p className="text-sm text-muted-foreground">{songCount} {songCount === 1 ? 'song' : 'songs'}</p>
                </Link>
            </div>
            <div className="flex items-center gap-1">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8" onClick={(e) => e.preventDefault()}>
                       <MoreVertical className="h-4 w-4" />
                     </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenuItem asChild>
                        <Link href={`/create?id=${setlist.id}`}>
                            <Edit className="mr-2 h-4 w-4" />
                            <span>Edit</span>
                        </Link>
                    </DropdownMenuItem>
                    
                    {!setlist.containsCustomSongs && (
                        setlist.isSynced ? (
                            <>
                                {setlist.needsSync && (
                                     <DropdownMenuItem onClick={handleSync} disabled={isSyncing}>
                                        {isSyncing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                                        <span>Sync to Cloud</span>
                                    </DropdownMenuItem>
                                )}
                                <DropdownMenuItem onClick={handleUnsync} disabled={isSyncing}>
                                    Unsync
                                </DropdownMenuItem>
                            </>
                        ) : (
                             <DropdownMenuItem onClick={handleSync} disabled={isSyncing}>
                                {isSyncing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <UploadCloud className="mr-2 h-4 w-4" />}
                                <span>Sync to Cloud</span>
                            </DropdownMenuItem>
                        )
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive focus:bg-destructive/10">
                            <Trash2 className="mr-2 h-4 w-4" />
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
                <Link href={`/setlists/${setlist.id}`} className="block">
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </Link>
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
        setSetlists(loadedSetlists.sort((a,b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)));
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

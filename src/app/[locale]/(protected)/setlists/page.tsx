'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getSetlists,
  deleteSetlist as deleteSetlistFromDb,
  syncSetlist,
  getSyncedSetlistsCount,
  type SetlistWithSyncStatus,
} from '@/lib/db';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { Button } from '@/components/ui/button';
import {
  Trash2,
  ListMusic,
  UploadCloud,
  CheckCircle,
  AlertTriangle,
  Edit,
  RefreshCw,
  PlusCircle,
  Share2,
  Users,
} from 'lucide-react';
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
} from '@/components/ui/alert-dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import { ShareSetlistDialog } from '@/components/ShareSetlistDialog';

const SYNC_LIMIT = 10;

function SetlistItem({
  setlist,
  onSetlistChange,
  onSyncLimitReached,
}: {
  setlist: SetlistWithSyncStatus;
  onSetlistChange: () => void;
  onSyncLimitReached: () => void;
}) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const isOwner = setlist.source === 'owner';

  const handleDelete = async () => {
    if (!user) return;
    try {
      await deleteSetlistFromDb(setlist.id, user.uid);
      toast({
        title: 'Setlist Removed',
        description: `"${setlist.title}" has been removed.`,
      });
      onSetlistChange();
    } catch {
      toast({
        title: 'Error',
        description: 'Could not remove the setlist.',
        variant: 'destructive',
      });
    }
  };

  const handleSync = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;
    setIsSyncing(true);

    try {
      await syncSetlist(setlist.id, user.uid, user.displayName || 'Anonymous');
      toast({
        title: 'Setlist Synced',
        description: `"${setlist.title}" is now available online.`,
      });
      onSetlistChange();
    } catch (error: any) {
      console.error('Sync error:', error);
      if (error.message === 'SYNC_LIMIT_REACHED') {
        onSyncLimitReached();
      } else {
        toast({
          title: 'Sync Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusIcon = () => {
    let icon: React.ReactNode;
    let tooltipText: string;

    if (!isOwner) {
      icon = <Users className='h-5 w-5 text-purple-500 flex-shrink-0' />;
      tooltipText = `Saved from ${setlist.authorName}`;
    } else if (setlist.needsSync) {
      icon = <UploadCloud className='h-5 w-5 text-blue-500 flex-shrink-0' />;
      tooltipText = 'Changes need to be synced.';
    } else if (setlist.isSynced) {
      icon = <CheckCircle className='h-5 w-5 text-green-500 flex-shrink-0' />;
      tooltipText = 'Synced with cloud';
    } else {
      icon = (
        <ListMusic className='h-5 w-5 text-muted-foreground flex-shrink-0' />
      );
      tooltipText = 'Local only';
    }

    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <span className='flex items-center'>{icon}</span>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tooltipText}</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  const songCount = setlist.songIds.length;
  const linkHref = isOwner
    ? `/setlists/${setlist.id}`
    : `/shared/setlists/${setlist.firestoreId}`;

  return (
    <>
      <div
        className={cn(
          'p-3 rounded-lg bg-muted/50 flex items-center justify-between transition-colors',
          'hover:bg-muted'
        )}
      >
        <Link
          href={linkHref}
          key={setlist.id}
          className='flex-grow flex items-center gap-4 min-w-0'
        >
          {getStatusIcon()}
          <div className='flex-grow min-w-0'>
            <h2 className='font-headline font-semibold text-base truncate'>
              {setlist.title}
            </h2>
            <p className='text-sm text-muted-foreground'>
              {isOwner
                ? `${songCount} ${songCount === 1 ? 'song' : 'songs'}`
                : `By ${setlist.authorName}`}
            </p>
          </div>
        </Link>
        <div className='flex items-center gap-1 ml-2'>
          {isOwner && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    asChild
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 text-muted-foreground'
                  >
                    <Link
                      href={`/setlists/edit/${setlist.id}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Edit className='h-4 w-4' />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit</p>
                </TooltipContent>
              </Tooltip>

              {setlist.isSynced && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsShareOpen(true);
                      }}
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-muted-foreground'
                    >
                      <Share2 className='h-4 w-4' />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Share</p>
                  </TooltipContent>
                </Tooltip>
              )}

              {setlist.isSynced ? (
                setlist.needsSync ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        onClick={handleSync}
                        disabled={isSyncing}
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 text-muted-foreground'
                      >
                        {isSyncing ? (
                          <RefreshCw className='h-4 w-4 animate-spin' />
                        ) : (
                          <UploadCloud className='h-4 w-4 text-blue-500' />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Sync Changes</p>
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8 text-green-500'
                        disabled
                      >
                        <CheckCircle className='h-4 w-4' />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Synced</p>
                    </TooltipContent>
                  </Tooltip>
                )
              ) : (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      onClick={handleSync}
                      disabled={isSyncing}
                      variant='ghost'
                      size='icon'
                      className='h-8 w-8 text-muted-foreground'
                    >
                      {isSyncing ? (
                        <RefreshCw className='h-4 w-4 animate-spin' />
                      ) : (
                        <UploadCloud className='h-4 w-4' />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Sync to Cloud</p>
                  </TooltipContent>
                </Tooltip>
              )}
            </>
          )}

          <AlertDialog>
            <Tooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <Button
                    variant='ghost'
                    size='icon'
                    className='h-8 w-8 text-muted-foreground hover:text-destructive'
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isOwner ? 'Delete' : 'Remove from my list'}</p>
              </TooltipContent>
            </Tooltip>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently{' '}
                  {isOwner ? 'delete' : 'remove'}
                  your setlist &quot;{setlist.title}&quot;.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className='bg-destructive hover:bg-destructive/90'
                >
                  {isOwner ? 'Delete' : 'Remove'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {setlist.isSynced && setlist.firestoreId && (
        <ShareSetlistDialog
          isOpen={isShareOpen}
          onOpenChange={setIsShareOpen}
          setlist={setlist}
          onStatusChange={onSetlistChange}
        />
      )}
    </>
  );
}

export default function SetlistsPage() {
  const [setlists, setSetlists] = useState<SetlistWithSyncStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [syncedCount, setSyncedCount] = useState(0);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const loadData = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const [loadedSetlists, count] = await Promise.all([
        getSetlists(user.uid),
        getSyncedSetlistsCount(user.uid),
      ]);
      setSetlists(
        loadedSetlists.sort(
          (a, b) => (b.updatedAt || b.createdAt) - (a.updatedAt || a.createdAt)
        )
      );
      setSyncedCount(count);
    } catch (error) {
      console.error('Failed to load setlist data:', error);
      toast({
        title: 'Error',
        description: 'Could not load your setlists.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (user) {
      loadData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleSyncLimitReached = () => {
    toast({
      title: 'Sync Limit Reached',
      description: `You can only sync up to ${SYNC_LIMIT} setlists online.`,
      variant: 'destructive',
    });
  };

  if (authLoading || !user) {
    return (
      <div className='flex-grow flex flex-col'>
        <Header />
        <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
          <div className='space-y-4'>
            <div className='space-y-1'>
              <Skeleton className='h-8 w-36' />
              <Skeleton className='h-4 w-24' />
            </div>
            <div className='space-y-2 pt-4'>
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-16 w-full' />
            </div>
          </div>
        </main>
        <BottomNavBar />
      </div>
    );
  }

  const isAnonymous = user.isAnonymous;

  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
        <div className='space-y-8'>
          <div className='flex justify-between items-center'>
            <div>
              <h1 className='text-3xl font-headline font-bold tracking-tight'>
                Setlists
              </h1>
              {!isAnonymous && (
                <p className='text-muted-foreground'>
                  Synced: {syncedCount}/{SYNC_LIMIT}
                </p>
              )}
            </div>
            {!isAnonymous && (
              <Button asChild>
                <Link href='/setlists/create'>
                  <PlusCircle className='mr-2 h-4 w-4' />
                  Create New
                </Link>
              </Button>
            )}
          </div>

          {isLoading ? (
            <div className='space-y-3'>
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-16 w-full' />
              <Skeleton className='h-16 w-full' />
            </div>
          ) : setlists.length > 0 ? (
            <TooltipProvider>
              <div className='space-y-3'>
                {setlists.map((setlist) => (
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
            <div className='text-center py-16 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full'>
              <ListMusic className='h-12 w-12 text-muted-foreground mb-4' />
              <h2 className='text-xl font-headline font-semibold'>
                No Setlists Found
              </h2>
              <p className='text-muted-foreground'>
                You haven&apos;t created or saved any setlists yet.
              </p>
              {!isAnonymous && (
                <Button variant='link' asChild>
                  <Link href='/setlists/create'>Create one now</Link>
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

    
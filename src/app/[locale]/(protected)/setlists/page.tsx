
// src/app/[locale]/(protected)/setlists/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  getSetlists,
  deleteSetlist,
  getSyncedSetlistsCount,
  syncSetlist as syncSetlistToCloud,
  saveSetlist,
  type SetlistWithSyncStatus,
  type Setlist,
} from '@/lib/db';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { Button } from '@/components/ui/button';
import {
  Trash2,
  ListMusic,
  CheckCircle,
  Edit,
  PlusCircle,
  Share2,
  Users,
  UploadCloud,
  RefreshCw,
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
import { useTranslations } from 'next-intl';

const SYNC_LIMIT = 10;

function SetlistItem({
  setlist,
  onSetlistChange,
}: {
  setlist: SetlistWithSyncStatus;
  onSetlistChange: () => void;
}) {
  const t = useTranslations();
  const { toast } = useToast();
  const { user } = useAuth();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const isOwner = setlist.source !== 'saved';

  const handleDelete = async () => {
    if (!user) return;
    try {
      await deleteSetlist(setlist.id, user.uid);
      toast({
        title: t('setlist.setlistRemovedToastTitle'),
        description: t('setlist.setlistRemovedToastDesc', {
          title: setlist.title,
        }),
      });
      onSetlistChange();
    } catch {
      toast({
        title: 'Error',
        description: t('setlist.setlistRemoveErrorToast'),
        variant: 'destructive',
      });
    }
  };

  const handleSync = async () => {
    if (!user || !setlist) return;
    setIsSyncing(true);
    try {
      let firestoreId: string;
      if (setlist.firestoreId) {
        // This is an update to an existing synced setlist
        await saveSetlist({ ...setlist, isSynced: true });
        firestoreId = setlist.firestoreId;
      } else {
        // This is a new setlist being synced for the first time
        firestoreId = await syncSetlistToCloud(
          setlist,
          user.uid,
          user.displayName || 'Anonymous'
        );
      }
      
      // Update local setlist with firestoreId and synced status
      await saveSetlist({
        ...setlist,
        firestoreId,
        isSynced: true,
        syncedAt: Date.now(),
        updatedAt: Date.now(),
      });

      toast({
        title: t('setlist.syncedToastTitle'),
        description: t('setlist.syncedToastDesc', { title: setlist.title }),
      });
      onSetlistChange();
    } catch (error) {
       if (error instanceof Error && error.message === 'SYNC_LIMIT_REACHED') {
         toast({
          title: t('setlist.syncLimitReachedTitle'),
          description: t('setlist.syncLimitReachedDesc', {limit: SYNC_LIMIT}),
          variant: 'destructive',
        });
       } else {
        toast({
          title: t('setlist.syncErrorTitle'),
          description: error instanceof Error ? error.message : "An unknown error occurred.",
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
      tooltipText = t('setlist.savedFromTooltip', {
        authorName: setlist.authorName,
      });
    } else if (setlist.isSynced) {
      icon = <CheckCircle className='h-5 w-5 text-green-500 flex-shrink-0' />;
      tooltipText = t('setlist.syncedTooltip');
    } else {
      icon = (
        <ListMusic className='h-5 w-5 text-muted-foreground flex-shrink-0' />
      );
      tooltipText = t('setlist.localOnlyTooltip'); // This might need a new translation key
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
                ? t('setlist.songCount', { count: songCount })
                : t('setlist.byAuthor', { authorName: setlist.authorName })}
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
                  <p>{t('setlist.editTooltip')}</p>
                </TooltipContent>
              </Tooltip>
              {setlist.isSynced ? (
                <>
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
                      <p>{t('setlist.shareTooltip')}</p>
                    </TooltipContent>
                  </Tooltip>
                {setlist.needsSync && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                       <Button onClick={handleSync} variant="ghost" size="icon" disabled={isSyncing} className='h-8 w-8 text-blue-500'>
                         {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                       </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{t('setlist.syncChangesTooltip')}</p></TooltipContent>
                  </Tooltip>
                )}
                </>
              ) : (
                 <Tooltip>
                    <TooltipTrigger asChild>
                       <Button onClick={handleSync} variant="ghost" size="icon" disabled={isSyncing} className='h-8 w-8 text-muted-foreground'>
                         {isSyncing ? <RefreshCw className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
                       </Button>
                    </TooltipTrigger>
                    <TooltipContent><p>{t('setlist.syncToCloudTooltip')}</p></TooltipContent>
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
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>
                <p>
                  {isOwner
                    ? t('setlist.deleteTooltip')
                    : t('setlist.removeFromListTooltip')}
                </p>
              </TooltipContent>
            </Tooltip>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
              <AlertDialogHeader>
                <AlertDialogTitle>
                  {t('setlist.deleteDialogTitle')}
                </AlertDialogTitle>
                <AlertDialogDescription>
                  {isOwner
                    ? t('setlist.deleteDialogDesc', { title: setlist.title })
                    : t('setlist.removeDialogDesc', { title: setlist.title })}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className='bg-destructive hover:bg-destructive/90'
                >
                  {isOwner
                    ? t('setlist.deleteButton')
                    : t('setlist.removeButton')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      {setlist.firestoreId && (
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
  const t = useTranslations();
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
                {t('setlist.title')}
              </h1>
              {!isAnonymous && (
                <p className='text-muted-foreground'>
                  {t('setlist.syncedCount', {
                    syncedCount: syncedCount,
                    limit: SYNC_LIMIT,
                  })}
                </p>
              )}
            </div>
            {!isAnonymous && (
              <Button asChild>
                <Link href='/setlists/create'>
                  <PlusCircle className='mr-2 h-4 w-4' />
                  {t('setlist.createNew')}
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
                  />
                ))}
              </div>
            </TooltipProvider>
          ) : (
            <div className='text-center py-16 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full'>
              <ListMusic className='h-12 w-12 text-muted-foreground mb-4' />
              <h2 className='text-xl font-headline font-semibold'>
                {t('setlist.noSetlistsTitle')}
              </h2>
              <p className='text-muted-foreground'>{t('setlist.noSetlistsDesc')}</p>
              {!isAnonymous && (
                <Button variant='link' asChild>
                  <Link href='/setlists/create'>{t('setlist.createOneNow')}</Link>
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

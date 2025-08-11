'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { type Setlist, SYNC_LIMIT } from '@/lib/db';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { Button } from '@/components/ui/button';
import { ListMusic, PlusCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';
import SetlistItem from './_component/SetlistItem';
import { useGetUserSetlistQuery } from '@/store/setlistApi';
import LocalsLink from '@/components/ui/LocalsLink';

export default function SetlistsPage() {
  const t = useTranslations();
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data, isLoading, refetch } = useGetUserSetlistQuery(user?.uid || '');

  useEffect(() => {
    if (data) {
      setSetlists(data);
    }
  }, [data]);
  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/');
    }
  }, [user, authLoading, router]);

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
  const ownerSetlists = setlists.filter((s) => s.source === 'owner');

  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
        <div className='space-y-8'>
          <div className='flex justify-between items-start'>
            <div>
              <h1 className='text-3xl font-headline font-bold tracking-tight'>
                {t('setlist.title')}
              </h1>
              <p className='text-sm text-muted-foreground'>
                {t('setlist.syncedCount', {
                  count: ownerSetlists.length,
                  limit: SYNC_LIMIT,
                })}
              </p>
            </div>
            {!isAnonymous && (
              <Button asChild>
                <LocalsLink href='/my-setlists/create'>
                  <PlusCircle className='mr-2 h-4 w-4' />
                  {t('setlist.createNew')}
                </LocalsLink>
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
                    onSetlistChange={refetch}
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
              <p className='text-muted-foreground'>
                {t('setlist.noSetlistsDesc')}
              </p>
              {!isAnonymous && (
                <Button variant='link' asChild>
                  <LocalsLink href='/my-setlists/create'>
                    {t('setlist.createOneNow')}
                  </LocalsLink>
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

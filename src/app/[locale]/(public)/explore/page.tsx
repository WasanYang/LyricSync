// src/app/[locale]/(public)/explore/page.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { type Setlist, getPublicSetlists } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { Search, ListMusic } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';
import Link from 'next/link';
import Header from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import SEOHead from '@/components/SEOHead';
import { pageSEOConfigs } from '@/lib/seo';
import { useTranslations } from 'next-intl';

function SetlistCard({ setlist }: { setlist: Setlist }) {
  const songCount = setlist.songIds.length;
  const t = useTranslations('setlist');
  return (
    <Link href={`/shared/setlists/${setlist.firestoreId}`} className='block'>
      <Card className='hover:bg-muted/50 transition-colors'>
        <CardContent className='p-4 flex items-center gap-4'>
          <div className='p-3 bg-muted rounded-md'>
            <ListMusic className='h-6 w-6 text-muted-foreground' />
          </div>
          <div>
            <p className='font-semibold font-headline truncate'>
              {setlist.title}
            </p>
            <p className='text-sm text-muted-foreground truncate'>
              {t('songCount', { count: songCount })} •{' '}
              {t('byAuthor', { authorName: setlist.authorName })}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function LoadingSkeleton() {
    return (
        <div className='space-y-4'>
            <Skeleton className='h-10 w-full' />
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <Skeleton className='h-20 w-full' />
                <Skeleton className='h-20 w-full' />
                <Skeleton className='h-20 w-full' />
                <Skeleton className='h-20 w-full' />
            </div>
        </div>
    )
}

export default function ExplorePage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchTerm = searchParams.get('q') || '';
  const t = useTranslations('explore');

  const [inputValue, setInputValue] = useState(searchTerm);
  const [publicSetlists, setPublicSetlists] = useState<Setlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (inputValue) {
        if (params.get('q') !== inputValue) {
          params.set('q', inputValue);
          router.replace(`${pathname}?${params.toString()}`);
        }
      } else {
        if (params.has('q')) {
          params.delete('q');
          router.replace(`${pathname}?${params.toString()}`);
        }
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [inputValue, pathname, router, searchParams]);

  useEffect(() => {
    const fetchPublicSetlists = async () => {
      setIsLoading(true);
      try {
        const publicLists = await getPublicSetlists();
        setPublicSetlists(publicLists);
      } catch (error) {
        console.error('Failed to load public setlists:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPublicSetlists();
  }, []);

  const filteredSetlists = useMemo(() => {
    if (!searchTerm) return publicSetlists;
    return publicSetlists.filter(
      (setlist) =>
        setlist.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        setlist.authorName?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, publicSetlists]);


  return (
    <>
      <SEOHead config={pageSEOConfigs.search(searchTerm)} />
      <div className='flex-grow flex flex-col'>
        <Header />
        <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
          <div className='space-y-8'>
            <div>
              <h1 className='text-3xl font-bold font-headline mb-2'>{t('title')}</h1>
              <p className='text-muted-foreground'>{t('description')}</p>
            </div>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10' />
              <Input
                type='search'
                placeholder={t('placeholder')}
                className='pl-10 text-base bg-muted focus-visible:ring-0 focus-visible:ring-offset-0'
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
            
            {isLoading ? <LoadingSkeleton /> : (
                <div className='space-y-4'>
                    {filteredSetlists.length > 0 ? (
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            {filteredSetlists.map((setlist) => (
                                <SetlistCard key={setlist.firestoreId} setlist={setlist} />
                            ))}
                        </div>
                    ) : (
                        <div className='text-center py-16 text-muted-foreground'>
                            <p>{t('noResults', {searchTerm})}</p>
                        </div>
                    )}
                </div>
            )}
          </div>
        </main>
        <BottomNavBar />
      </div>
    </>
  );
}
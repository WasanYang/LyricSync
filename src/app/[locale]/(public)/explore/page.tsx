// src/app/[locale]/(public)/explore/page.tsx
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { getPublicUsers, type PublicUser } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';
import Link from 'next/link';
import Header from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import SEOHead from '@/components/SEOHead';
import { pageSEOConfigs } from '@/lib/seo';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ListMusic } from 'lucide-react';


function UserCard({ user }: { user: PublicUser }) {
  const t = useTranslations('explore');
  return (
    <Link href={`/users/${user.uid}`} className='block'>
      <Card className='hover:bg-muted/50 transition-colors'>
        <CardContent className='p-4 flex items-center gap-4'>
          <Avatar className='h-12 w-12'>
            {user.photoURL && <AvatarImage src={user.photoURL} alt={user.displayName} />}
            <AvatarFallback>{user.displayName?.[0].toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          <div>
            <p className='font-semibold font-headline truncate'>{user.displayName}</p>
            <p className='text-sm text-muted-foreground truncate flex items-center gap-1.5'>
              <ListMusic className="h-3 w-3" />
              {t('sharedSetlistsCount', { count: user.publicSetlistsCount })}
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
  const [publicUsers, setPublicUsers] = useState<PublicUser[]>([]);
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
    const fetchPublicUsers = async () => {
      setIsLoading(true);
      try {
        const users = await getPublicUsers();
        setPublicUsers(users);
      } catch (error) {
        console.error('Failed to load public users:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchPublicUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return publicUsers;
    return publicUsers.filter(
      (user) =>
        user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, publicUsers]);


  return (
    <>
      <SEOHead config={pageSEOConfigs.search(searchTerm)} />
      <div className='flex-grow flex flex-col'>
        <Header />
        <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
          <div className='space-y-8'>
            <div>
              <h1 className='text-3xl font-bold font-headline mb-2'>{t('titleUsers')}</h1>
              <p className='text-muted-foreground'>{t('descriptionUsers')}</p>
            </div>
            <div className='relative'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10' />
              <Input
                type='search'
                placeholder={t('placeholderUsers')}
                className='pl-10 text-base bg-muted focus-visible:ring-0 focus-visible:ring-offset-0'
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
              />
            </div>
            
            {isLoading ? <LoadingSkeleton /> : (
                <div className='space-y-4'>
                    {filteredUsers.length > 0 ? (
                        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                            {filteredUsers.map((user) => (
                                <UserCard key={user.uid} user={user} />
                            ))}
                        </div>
                    ) : (
                        <div className='text-center py-16 text-muted-foreground'>
                            <p>{t('noResultsUsers', {searchTerm})}</p>
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

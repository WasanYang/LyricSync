// src/app/[locale]/(public)/explore/page.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import type { PublicUser } from '@/lib/db';
import { getPublicUsers } from '@/lib/db';
import { Input } from '@/components/ui/input';
import { Search, Users } from 'lucide-react';
import BottomNavBar from '@/components/BottomNavBar';
import Link from 'next/link';
import Header from '@/components/Header';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import SEOHead from '@/components/SEOHead';
import { pageSEOConfigs } from '@/lib/seo';
import { useTranslations } from 'next-intl';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import LocalsLink from '@/components/ui/LocalsLink';

function UserCard({ user }: { user: PublicUser }) {
  const t = useTranslations('explore');
  return (
    <LocalsLink href={`/users/${user.uid}`} className='block'>
      <Card className='hover:bg-muted/50 transition-colors h-full'>
        <CardContent className='p-4 flex flex-col items-center text-center gap-3'>
          <Avatar className='h-16 w-16 text-2xl'>
            <AvatarImage src={user.photoURL} alt={user.displayName} />
            <AvatarFallback>
              {user.displayName?.[0].toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className='flex-grow'>
            <p className='font-semibold font-headline truncate'>
              {user.displayName}
            </p>
            <p className='text-sm text-muted-foreground'>
              {t('sharedSetlistsCount', { count: user.publicSetlistsCount })}
            </p>
          </div>
        </CardContent>
      </Card>
    </LocalsLink>
  );
}

function LoadingSkeleton() {
  return (
    <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
      {[...Array(8)].map((_, i) => (
        <Card key={i}>
          <CardContent className='p-4 flex flex-col items-center text-center gap-3'>
            <Skeleton className='h-16 w-16 rounded-full' />
            <div className='w-full space-y-2'>
              <Skeleton className='h-5 w-3/4 mx-auto' />
              <Skeleton className='h-4 w-1/2 mx-auto' />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function ExploreUsersPage() {
  const t = useTranslations('explore');
  const [searchTerm, setSearchTerm] = useState('');
  const [allUsers, setAllUsers] = useState<PublicUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      try {
        const users = await getPublicUsers();
        setAllUsers(users);
      } catch (error) {
        console.error('Failed to load public users:', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    if (!searchTerm) return allUsers;
    return allUsers.filter((user) =>
      user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, allUsers]);

  return (
    <>
      <SEOHead config={pageSEOConfigs.search(searchTerm)} />
      <div className='flex-grow flex flex-col'>
        <Header />
        <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
          <div className='space-y-8'>
            <div className='text-center'>
              <h1 className='text-3xl font-bold font-headline'>
                {t('titleUsers')}
              </h1>
              <p className='text-muted-foreground mt-1'>
                {t('descriptionUsers')}
              </p>
            </div>
            <div className='relative max-w-lg mx-auto'>
              <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10' />
              <Input
                type='search'
                placeholder={t('placeholderUsers')}
                className='pl-10 text-base bg-muted focus-visible:ring-0 focus-visible:ring-offset-0'
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {isLoading ? (
              <LoadingSkeleton />
            ) : filteredUsers.length > 0 ? (
              <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                {filteredUsers.map((user) => (
                  <UserCard key={user.uid} user={user} />
                ))}
              </div>
            ) : (
              <div className='text-center py-16'>
                <Users className='mx-auto h-12 w-12 text-muted-foreground' />
                <h3 className='mt-4 text-lg font-semibold'>
                  {t('noResultsUsers', { searchTerm })}
                </h3>
              </div>
            )}
          </div>
        </main>
        <BottomNavBar />
      </div>
    </>
  );
}

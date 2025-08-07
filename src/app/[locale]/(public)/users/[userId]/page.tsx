// src/app/[locale]/(public)/users/[userId]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, notFound } from 'next/navigation';
import { getDoc, doc } from 'firebase/firestore';
import { getPublicSetlistsByUserId, type Setlist } from '@/lib/db';
import { db } from '@/lib/firebase';
import type { User } from '@/lib/types/database';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { ListMusic } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

function UserProfileSkeleton() {
  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='container mx-auto px-4 py-8 pb-24 md:pb-8 space-y-8'>
        <div className='flex items-center gap-4'>
          <Skeleton className='h-20 w-20 rounded-full' />
          <div className='space-y-2'>
            <Skeleton className='h-7 w-48' />
            <Skeleton className='h-5 w-32' />
          </div>
        </div>
        <div>
          <Skeleton className='h-6 w-40 mb-4' />
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <Skeleton className='h-20' />
            <Skeleton className='h-20' />
          </div>
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

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
              {t('songCount', { count: songCount })}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function UserPublicProfilePage() {
  const params = useParams();
  const userId = Array.isArray(params.userId)
    ? params.userId[0]
    : params.userId;
  const t = useTranslations('explore');

  const [user, setUser] = useState<User | null>(null);
  const [setlists, setSetlists] = useState<Setlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!userId || !db) {
      notFound();
    }

    async function fetchData() {
      setIsLoading(true);
      try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists() || !userSnap.data().isProfilePublic) {
          notFound();
          return;
        }

        const userData = userSnap.data() as User;
        setUser(userData);

        const userSetlists = await getPublicSetlistsByUserId(userId);
        setSetlists(userSetlists);
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        notFound();
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [userId]);

  if (isLoading) {
    return <UserProfileSkeleton />;
  }

  if (!user) {
    return notFound();
  }

  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='container mx-auto px-4 py-8 pb-24 md:pb-8 space-y-8'>
        <section className='flex items-center gap-4'>
          <Avatar className='h-20 w-20 text-3xl'>
            {user.photoURL && (
              <AvatarImage src={user.photoURL} alt={user.displayName} />
            )}
            <AvatarFallback>
              {user.displayName?.[0].toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className='text-3xl font-bold font-headline'>
              {user.displayName}
            </h1>
          </div>
        </section>

        <section>
          <h2 className='text-xl font-semibold font-headline mb-4'>
            {t('publicSetlistsTitle')} ({setlists.length})
          </h2>
          {setlists.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              {setlists.map((setlist) => (
                <SetlistCard key={setlist.firestoreId} setlist={setlist} />
              ))}
            </div>
          ) : (
            <div className='text-center py-16 border-2 border-dashed rounded-lg'>
              <p className='text-muted-foreground'>{t('noPublicSetlists')}</p>
            </div>
          )}
        </section>
      </main>
      <BottomNavBar />
    </div>
  );
}

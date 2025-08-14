// src/components/Header.tsx
'use client';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { NotificationBell } from './NotificationBell';
import LocalsLink from './ui/LocalsLink';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { Button } from './ui/button';
import { User } from 'lucide-react';
import HamburgerMenu from './HamburgerMenu';

const OfflineIndicator = dynamic(
  () => import('./OfflineIndicator').then((mod) => mod.OfflineIndicator),
  {
    ssr: false,
  }
);

export default function Header() {
  const t = useTranslations();
  const { user } = useAuth();

  return (
    <header className='sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='flex h-16 items-center justify-between px-4'>
        {/* Title */}
        <div className='flex items-center'>
          <LocalsLink href='/' className='flex items-center space-x-2'>
            <span className='font-bold font-headline text-2xl'>Explore</span>
          </LocalsLink>
        </div>

        {/* Right side actions */}
        <div className='flex items-center justify-end space-x-2'>
          <NotificationBell />
          <Button asChild variant='ghost' size='icon'>
            <LocalsLink href='/profile'>
              <Avatar className='h-8 w-8'>
                {user && user.photoURL && <AvatarImage src={user.photoURL} />}
                <AvatarFallback>
                  {user && !user.isAnonymous ? (
                    user.displayName?.[0].toUpperCase()
                  ) : (
                    <User className='h-4 w-4' />
                  )}
                </AvatarFallback>
              </Avatar>
              <span className='sr-only'>Profile</span>
            </LocalsLink>
          </Button>
        </div>
      </div>
    </header>
  );
}

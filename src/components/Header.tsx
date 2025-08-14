// src/components/Header.tsx
'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import dynamic from 'next/dynamic';
import { NotificationBell } from './NotificationBell';
import LocalsLink from './ui/LocalsLink';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '@/context/AuthContext';

const HamburgerMenu = dynamic(() => import('./HamburgerMenu'), {
  ssr: false,
});

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
    <header className='sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
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
          <LocalsLink href='/profile'>
            <Avatar className='h-8 w-8'>
              {user && user.photoURL && <AvatarImage src={user.photoURL} />}
              <AvatarFallback>
                {user?.displayName?.[0].toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
          </LocalsLink>
          <HamburgerMenu />
          <OfflineIndicator showBanner={true} />
        </div>
      </div>
    </header>
  );
}

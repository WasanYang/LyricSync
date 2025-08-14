// src/components/Header.tsx
'use client';

import { useTranslations } from 'next-intl';
import dynamic from 'next/dynamic';
import { NotificationBell } from './NotificationBell';
import LocalsLink from './ui/LocalsLink';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { Button } from './ui/button';
import { User, Settings } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from './ui/sheet';
import ProfileCard from './ProfileCard';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

export default function Header() {
  const t = useTranslations();
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
    // Control sheet visibility based on URL
    if (searchParams.get('panel') === 'profile') {
      setIsProfileOpen(true);
    } else {
      setIsProfileOpen(false);
    }
  }, [searchParams]);

  const handleProfileOpenChange = (open: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (open) {
      params.set('panel', 'profile');
    } else {
      params.delete('panel');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  return (
    <header className='sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='container mx-auto flex h-16 items-center justify-between px-4'>
        {/* Title */}
        <div className='flex items-center'>
          <LocalsLink href='/' className='flex items-center space-x-2'>
            <span className='font-bold font-headline text-2xl'>Explore</span>
          </LocalsLink>
        </div>

        {/* Right side actions */}
        <div className='flex items-center justify-end space-x-2'>
          <Button variant='ghost' size='icon' asChild>
            <LocalsLink href='/search'>
              <Search className='h-5 w-5' />
              <span className='sr-only'>Search</span>
            </LocalsLink>
          </Button>
          <NotificationBell />
          <Sheet open={isProfileOpen} onOpenChange={handleProfileOpenChange}>
            <SheetTrigger asChild>
              <Button variant='ghost' size='icon'>
                <Avatar className='h-8 w-8'>
                  {user && user.photoURL && (
                    <AvatarImage src={user.photoURL} />
                  )}
                  <AvatarFallback>
                    {user && !user.isAnonymous ? (
                      user.displayName?.[0].toUpperCase()
                    ) : (
                      <User className='h-4 w-4' />
                    )}
                  </AvatarFallback>
                </Avatar>
                <span className='sr-only'>Profile</span>
              </Button>
            </SheetTrigger>
            <SheetContent
              className='w-full md:max-w-sm p-0'
              showCloseButton={false}
            >
              <SheetTitle className='sr-only'>Profile</SheetTitle>
              <ProfileCard />
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

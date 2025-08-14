// src/components/Header.tsx
'use client';

import React from 'react';
import { NotificationBell } from './NotificationBell';
import LocalsLink from './ui/LocalsLink';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { Button } from './ui/button';
import { User } from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from './ui/sheet';
import ProfileCard from './ProfileCard';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

// --- Sub-components ---

const HeaderTitle = ({ children }: { children: React.ReactNode }) => (
  <div className='flex-1'>
    <LocalsLink href='/' className='flex items-center space-x-2'>
      <h1 className='font-bold font-headline text-2xl'>{children}</h1>
    </LocalsLink>
  </div>
);
HeaderTitle.displayName = 'HeaderTitle';

const HeaderActions = ({ children }: { children: React.ReactNode }) => (
  <div className='flex items-center justify-end space-x-2'>{children}</div>
);
HeaderActions.displayName = 'HeaderActions';

const HeaderProfile = () => {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  useEffect(() => {
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
    <Sheet open={isProfileOpen} onOpenChange={handleProfileOpenChange}>
      <SheetTrigger asChild>
        <Button variant='ghost' size='icon'>
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
        </Button>
      </SheetTrigger>
      <SheetContent className='w-full md:max-w-sm p-0' showCloseButton={false}>
        <SheetTitle className='sr-only'>Profile</SheetTitle>
        <ProfileCard />
      </SheetContent>
    </Sheet>
  );
};
HeaderProfile.displayName = 'HeaderProfile';

// --- Main Header Component ---

type HeaderRootProps = {
  children: React.ReactNode;
  className?: string;
};

const HeaderRoot = React.forwardRef<HTMLElement, HeaderRootProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <header
        ref={ref}
        className='sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'
        {...props}
      >
        <div className='container mx-auto flex h-16 items-center justify-between px-4'>
          {children}
        </div>
      </header>
    );
  }
);
HeaderRoot.displayName = 'HeaderRoot';

export const HeaderWrapper = {
  Root: HeaderRoot,
  Title: HeaderTitle,
  Actions: HeaderActions,
  Profile: HeaderProfile,
  Notification: NotificationBell,
};

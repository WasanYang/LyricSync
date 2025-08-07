// src/components/NotificationBell.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Bell } from 'lucide-react';
import { NotificationPanel } from './NotificationPanel';
import { useAuth } from '@/context/AuthContext';
import { useUnreadNotifications } from '@/lib/notifications';

export function NotificationBell() {
  const { user } = useAuth();
  const { unreadCount } = useUnreadNotifications(user?.uid);
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant='ghost' size='icon' className='relative'>
          <Bell className='h-5 w-5' />
          {unreadCount > 0 && (
            <span className='absolute top-1 right-1 flex h-3 w-3'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75'></span>
              <span className='relative inline-flex rounded-full h-3 w-3 bg-primary'></span>
            </span>
          )}
          <span className='sr-only'>Open notifications</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side='right'
        className='p-0 flex flex-col max-h-screen w-full max-w-sm'
        showCloseButton={false}
      >
        <NotificationPanel onClose={() => setIsOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}

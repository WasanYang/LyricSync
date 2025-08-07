// src/app/[locale]/(public)/updates/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  getAllAdminNotifications,
  type AppNotification,
} from '@/lib/notifications';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { BellRing } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

function NotificationItem({
  notification,
}: {
  notification: AppNotification;
}) {
  return (
    <div className='p-4 border-b last:border-b-0'>
      <div className='flex justify-between items-start'>
        <h3 className='font-semibold font-headline'>{notification.title}</h3>
        <p className='text-xs text-muted-foreground whitespace-nowrap pl-4'>
          {new Date(notification.createdAt).toLocaleDateString()}
        </p>
      </div>
      {/* For now, just rendering details as pre-wrap text. Could be parsed as Markdown. */}
      <p className='text-sm text-muted-foreground mt-1 whitespace-pre-wrap'>
        {notification.details || notification.message}
      </p>
      {notification.targetUrl && (
        <Button asChild variant='link' className='p-0 h-auto mt-2'>
          <Link href={notification.targetUrl}>View Details</Link>
        </Button>
      )}
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className='space-y-4'>
      {[...Array(5)].map((_, i) => (
        <div key={i} className='p-4 border-b'>
          <div className='flex justify-between'>
            <Skeleton className='h-5 w-1/2' />
            <Skeleton className='h-4 w-16' />
          </div>
          <Skeleton className='h-4 w-full mt-2' />
          <Skeleton className='h-4 w-3/4 mt-1' />
        </div>
      ))}
    </div>
  );
}

export default function UpdatesPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const t = useTranslations('updates');

  const loadNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch all "sent" public notifications
      const fetchedNotifications = await getAllAdminNotifications();
      const publicNotifications = fetchedNotifications.filter(notif => notif.status === 'sent');
      setNotifications(publicNotifications);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
        <div className='space-y-6'>
          <h1 className='text-3xl font-bold font-headline'>{t('title')}</h1>

          {isLoading ? (
            <LoadingSkeleton />
          ) : notifications.length > 0 ? (
            <div className='border rounded-lg'>
              {notifications.map((notif) => (
                <NotificationItem key={notif.id} notification={notif} />
              ))}
            </div>
          ) : (
            <div className='text-center py-16 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full'>
              <BellRing className='h-12 w-12 text-muted-foreground mb-4' />
              <h2 className='text-xl font-headline font-semibold'>
                {t('emptyTitle')}
              </h2>
              <p className='text-muted-foreground'>{t('emptyDesc')}</p>
            </div>
          )}
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

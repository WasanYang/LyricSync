// src/components/NotificationPanel.tsx
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import {
  useUnreadNotifications,
  markAllNotificationsAsRead,
  type AppNotification,
} from '@/lib/notifications';
import { Button } from '@/components/ui/button';
import { BellRing, Check, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

function PanelNotificationItem({
  notification,
  onClose,
}: {
  notification: AppNotification;
  onClose: () => void;
}) {
  const content = (
    <div className='block w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors'>
      <p className='font-semibold text-sm'>{notification.title}</p>
      <p className='text-xs text-muted-foreground line-clamp-1'>
        {notification.message}
      </p>
      <p className='text-xs text-muted-foreground/80 mt-1'>
        {new Date(notification.createdAt).toLocaleDateString()}
      </p>
    </div>
  );

  if (notification.targetUrl) {
    return (
      <Link href={notification.targetUrl} onClick={onClose}>
        {content}
      </Link>
    );
  }
  return content;
}

export function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const {
    notifications,
    unreadCount,
    loading,
    refresh: refreshNotifications,
  } = useUnreadNotifications(user?.uid);
  const t = useTranslations('notifications');

  const handleMarkAllRead = async () => {
    if (!user) return;
    await markAllNotificationsAsRead(user.uid);
    refreshNotifications(); // Refresh the list
  };

  useEffect(() => {
    // When the panel opens, we could mark them as "seen" but not "read"
    // For now, we only mark as read on the full page or with the button
  }, []);

  return (
    <div className='flex flex-col h-full'>
      <header className='p-4 border-b flex items-center justify-between'>
        <h2 className='text-lg font-semibold font-headline'>{t('title')}</h2>
        <Button variant='ghost' size='icon' onClick={onClose}>
          <X className='h-4 w-4' />
        </Button>
      </header>
      <ScrollArea className='flex-grow'>
        {loading ? (
          <p className='p-4 text-sm text-muted-foreground'>Loading...</p>
        ) : notifications.length > 0 ? (
          <div>
            {notifications.map((notif) => (
              <PanelNotificationItem
                key={notif.id}
                notification={notif}
                onClose={onClose}
              />
            ))}
          </div>
        ) : (
          <div className='p-8 text-center text-muted-foreground'>
            <BellRing className='mx-auto h-8 w-8 mb-2' />
            <p className='text-sm'>{t('emptyTitle')}</p>
          </div>
        )}
      </ScrollArea>
      <footer className='p-4 border-t space-y-2'>
        <Button
          variant='outline'
          size='sm'
          className='w-full'
          disabled={unreadCount === 0}
          onClick={handleMarkAllRead}
        >
          <Check className='mr-2 h-4 w-4' /> {t('markAllAsRead')}
        </Button>
        <Button asChild size='sm' className='w-full'>
          <Link href='/notifications' onClick={onClose}>
            {t('viewAll')}
          </Link>
        </Button>
      </footer>
    </div>
  );
}

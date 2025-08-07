// src/app/[locale]/(admin)/dashboard/notifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import {
  getAllAdminNotifications,
  deleteNotification,
  type AppNotification,
} from '@/lib/notifications';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function AdminNotificationsListPage() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const notifs = await getAllAdminNotifications();
      setNotifications(notifs);
    } catch (error) {
      console.log('Failed to fetch notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch notifications.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDelete = async (id: string, title: string) => {
    try {
      await deleteNotification(id);
      toast({
        title: 'Notification Deleted',
        description: `"${title}" has been successfully deleted.`,
      });
      fetchNotifications(); // Refresh the list
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: AppNotification['status']) => {
    const variants = {
      draft: 'secondary',
      scheduled: 'default',
      sent: 'outline',
    } as const;
    return (
      <Badge variant={variants[status]} className='capitalize'>
        {status}
      </Badge>
    );
  };

  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
        <div className='space-y-8'>
          <div className='flex justify-between items-center'>
            <h1 className='text-3xl font-bold font-headline'>Notifications</h1>
            <Button asChild>
              <Link href='/dashboard/notifications/create'>
                <PlusCircle className='mr-2 h-4 w-4' />
                Create Notification
              </Link>
            </Button>
          </div>
          <div className='border rounded-lg'>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Scheduled For</TableHead>
                  <TableHead className='text-right'>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className='h-24 text-center'>
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : notifications.length > 0 ? (
                  notifications.map((notif) => (
                    <TableRow key={notif.id}>
                      <TableCell className='font-medium'>
                        {notif.title}
                      </TableCell>
                      <TableCell>{getStatusBadge(notif.status)}</TableCell>
                      <TableCell>
                        {new Date(notif.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {notif.scheduledAt
                          ? new Date(notif.scheduledAt).toLocaleString()
                          : 'Not scheduled'}
                      </TableCell>
                      <TableCell className='text-right'>
                        <Button asChild variant='ghost' size='icon'>
                          <Link
                            href={`/dashboard/notifications/edit/${notif.id}`}
                          >
                            <Edit className='h-4 w-4' />
                          </Link>
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant='ghost'
                              size='icon'
                              className='text-destructive'
                            >
                              <Trash2 className='h-4 w-4' />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will permanently delete the notification "
                                {notif.title}".
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() =>
                                  handleDelete(notif.id, notif.title)
                                }
                                className='bg-destructive hover:bg-destructive/90'
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className='h-24 text-center'>
                      No notifications found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

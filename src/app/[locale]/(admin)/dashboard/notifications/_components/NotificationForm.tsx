// src/app/[locale]/(admin)/dashboard/notifications/_components/NotificationForm.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { v4 as uuidv4 } from 'uuid';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useToast } from '@/hooks/use-toast';
import {
  saveNotification,
  getNotification,
  type AppNotification,
} from '@/lib/notifications';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { Send, Loader2, Calendar as CalendarIcon, Clock } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

const notificationFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  message: z.string().min(1, 'Short message is required.'),
  details: z.string().optional(),
  targetUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  sendOption: z.enum(['now', 'later']),
  scheduledAt: z.date().optional(),
});

type NotificationFormValues = z.infer<typeof notificationFormSchema>;

export default function NotificationForm({
  notificationId,
}: {
  notificationId?: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const isEditing = !!notificationId;
  const [isLoading, setIsLoading] = useState(isEditing);

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      title: '',
      message: '',
      details: '',
      targetUrl: '',
      sendOption: 'now',
    },
  });

  const {
    handleSubmit,
    control,
    watch,
    reset,
    formState: { isSubmitting },
  } = form;
  const sendOption = watch('sendOption');

  useEffect(() => {
    if (isEditing && notificationId) {
      getNotification(notificationId).then((notif) => {
        if (notif) {
          reset({
            title: notif.title,
            message: notif.message,
            details: notif.details || '',
            targetUrl: notif.targetUrl || '',
            sendOption: notif.scheduledAt ? 'later' : 'now',
            scheduledAt: notif.scheduledAt ? new Date(notif.scheduledAt) : undefined,
          });
        }
        setIsLoading(false);
      });
    }
  }, [isEditing, notificationId, reset]);

  async function onSubmit(data: NotificationFormValues) {
    const finalData: Omit<AppNotification, 'createdAt'> = {
      id: notificationId || uuidv4(),
      title: data.title,
      message: data.message,
      details: data.details,
      targetUrl: data.targetUrl,
      status: data.sendOption === 'now' ? 'sent' : 'scheduled',
      scheduledAt: data.sendOption === 'later' && data.scheduledAt ? Timestamp.fromDate(data.scheduledAt).toMillis() : null,
    };
    
    // In a real app, 'sent' status for 'now' would trigger a cloud function immediately.
    // For now, we just save it with the status.

    try {
      await saveNotification(finalData);
      toast({
        title: `Notification ${isEditing ? 'Updated' : 'Saved'}`,
        description: `"${data.title}" has been successfully saved.`,
      });
      router.push('/dashboard/notifications');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save notification.',
        variant: 'destructive',
      });
      console.error('Failed to save notification:', error);
    }
  }
  
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
        <div className='max-w-2xl mx-auto space-y-8'>
          <div>
            <h1 className='text-3xl font-bold font-headline'>
              {isEditing ? 'Edit Notification' : 'Create Notification'}
            </h1>
            <p className='text-muted-foreground'>
              Send a message to your users.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={control}
                name='title'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder='New feature available!' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name='message'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Short Message (for Panel)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Check out the new lyric import feature.'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name='details'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Details (Markdown supported)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='You can now import songs from...'
                        className='min-h-[150px]'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name='targetUrl'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='/new-feature-page' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={control}
                name='sendOption'
                render={({ field }) => (
                  <FormItem className='space-y-3'>
                    <FormLabel>Send Options</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className='flex space-x-4'
                      >
                        <FormItem className='flex items-center space-x-3 space-y-0'>
                          <FormControl>
                            <RadioGroupItem value='now' />
                          </FormControl>
                          <FormLabel className='font-normal'>Send Now</FormLabel>
                        </FormItem>
                        <FormItem className='flex items-center space-x-3 space-y-0'>
                          <FormControl>
                            <RadioGroupItem value='later' />
                          </FormControl>
                          <FormLabel className='font-normal'>Schedule for Later</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                  </FormItem>
                )}
              />

              {sendOption === 'later' && (
                <FormField
                  control={control}
                  name="scheduledAt"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Scheduled Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-[240px] pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "PPP")
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date < new Date() || date < new Date("1900-01-01")}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormDescription>
                        The notification will be sent at the selected time (server time).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <Button type='submit' size='lg' disabled={isSubmitting}>
                {isSubmitting ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Send className='mr-2 h-4 w-4' />
                )}
                {isEditing ? 'Update Notification' : 'Save Notification'}
              </Button>
            </form>
          </Form>
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

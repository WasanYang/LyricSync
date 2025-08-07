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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  saveNotification,
  getNotification,
  type AppNotification,
} from '@/lib/notifications';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { Send, Loader2, Calendar as CalendarIcon, User, Users } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, set, isBefore } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

const notificationFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  message: z.string().min(1, 'Short message is required.'),
  details: z.string().optional(),
  targetUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  recipientType: z.enum(['ALL_USERS', 'SPECIFIC_USERS']).default('ALL_USERS'),
  recipientIds: z.string().optional(),
  sendOption: z.enum(['now', 'later']),
  scheduledDate: z.date().optional(),
  scheduledHour: z.string().optional(),
  scheduledMinute: z.string().optional(),
}).refine(data => {
  if (data.sendOption === 'later' && !data.scheduledDate) {
    return false;
  }
  if (data.sendOption === 'later' && data.scheduledDate) {
    const now = new Date();
    const scheduledDateTime = set(data.scheduledDate, {
      hours: parseInt(data.scheduledHour || '0', 10),
      minutes: parseInt(data.scheduledMinute || '0', 10),
      seconds: 0,
      milliseconds: 0,
    });
    return !isBefore(scheduledDateTime, now);
  }
  return true;
}, {
  message: 'Scheduled date and time must be in the future.',
  path: ['scheduledDate'],
});

type NotificationFormValues = z.infer<typeof notificationFormSchema>;

const generateTimeOptions = (max: number) => {
  return Array.from({ length: max }, (_, i) => i.toString().padStart(2, '0'));
};

export default function NotificationForm({
  notificationId,
}: {
  notificationId?: string;
}) {
  const { toast } = useToast();
  const router = useRouter();
  const isEditing = !!notificationId;
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSent, setIsSent] = useState(false);

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      title: '',
      message: '',
      details: '',
      targetUrl: '',
      recipientType: 'ALL_USERS',
      recipientIds: '',
      sendOption: 'now',
      scheduledHour: '09',
      scheduledMinute: '00',
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
  const recipientType = watch('recipientType');

  useEffect(() => {
    if (isEditing && notificationId) {
      getNotification(notificationId).then((notif) => {
        if (notif) {
          if (notif.status === 'sent') {
            setIsSent(true);
          }
          const scheduledAtDate = notif.scheduledAt ? new Date(notif.scheduledAt) : new Date();
          reset({
            title: notif.title,
            message: notif.message,
            details: notif.details || '',
            targetUrl: notif.targetUrl || '',
            recipientType: notif.recipientType || 'ALL_USERS',
            recipientIds: (notif.recipientIds || []).join(', '),
            sendOption: notif.scheduledAt ? 'later' : 'now',
            scheduledDate: notif.scheduledAt ? scheduledAtDate : undefined,
            scheduledHour: notif.scheduledAt ? format(scheduledAtDate, 'HH') : '09',
            scheduledMinute: notif.scheduledAt ? format(scheduledAtDate, 'mm') : '00',
          });
        }
        setIsLoading(false);
      });
    }
  }, [isEditing, notificationId, reset]);

  async function onSubmit(data: NotificationFormValues) {
    let scheduledAt = null;
    if (data.sendOption === 'later' && data.scheduledDate) {
       const scheduledDateTime = set(data.scheduledDate, {
         hours: parseInt(data.scheduledHour!, 10),
         minutes: parseInt(data.scheduledMinute!, 10),
       });
       scheduledAt = Timestamp.fromDate(scheduledDateTime).toMillis();
    }
    
    const finalData: Omit<AppNotification, 'createdAt'> = {
      id: notificationId || uuidv4(),
      title: data.title,
      message: data.message,
      details: data.details,
      targetUrl: data.targetUrl,
      recipientType: data.recipientType,
      recipientIds: data.recipientType === 'SPECIFIC_USERS' ? data.recipientIds?.split(',').map(s => s.trim()).filter(Boolean) : [],
      status: data.sendOption === 'now' ? 'sent' : 'scheduled',
      scheduledAt,
    };

    try {
      await saveNotification(finalData);
      toast({
        title: `Notification Saved`,
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
              {isSent && <span className='text-destructive font-bold ml-2'>(This notification has been sent and cannot be edited)</span>}
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
              <fieldset disabled={isSubmitting || isSent} className="space-y-6">
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
                  name='recipientType'
                  render={({ field }) => (
                    <FormItem className='space-y-3'>
                      <FormLabel>Recipients</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className='flex space-x-4'>
                          <FormItem className='flex items-center space-x-3 space-y-0'>
                            <FormControl><RadioGroupItem value='ALL_USERS' /></FormControl>
                            <FormLabel className='font-normal flex items-center gap-2'><Users className="h-4 w-4" /> All Users</FormLabel>
                          </FormItem>
                          <FormItem className='flex items-center space-x-3 space-y-0'>
                            <FormControl><RadioGroupItem value='SPECIFIC_USERS' /></FormControl>
                            <FormLabel className='font-normal flex items-center gap-2'><User className="h-4 w-4" /> Specific Users</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {recipientType === 'SPECIFIC_USERS' && (
                  <FormField
                    control={control}
                    name='recipientIds'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>User IDs</FormLabel>
                        <FormControl>
                          <Textarea placeholder='Enter user IDs, separated by commas' {...field} />
                        </FormControl>
                        <FormDescription>Separate multiple user IDs with a comma (,)</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
                
                <FormField
                  control={control}
                  name='sendOption'
                  render={({ field }) => (
                    <FormItem className='space-y-3'>
                      <FormLabel>Send Options</FormLabel>
                      <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className='flex space-x-4'>
                          <FormItem className='flex items-center space-x-3 space-y-0'>
                            <FormControl><RadioGroupItem value='now' /></FormControl>
                            <FormLabel className='font-normal'>Send Now</FormLabel>
                          </FormItem>
                          <FormItem className='flex items-center space-x-3 space-y-0'>
                            <FormControl><RadioGroupItem value='later' /></FormControl>
                            <FormLabel className='font-normal'>Schedule for Later</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                    </FormItem>
                  )}
                />

                {sendOption === 'later' && (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
                    <FormField
                      control={control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col sm:col-span-1">
                          <FormLabel>Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                           <FormMessage />
                        </FormItem>
                      )}
                    />
                     <FormField
                        control={control}
                        name="scheduledHour"
                        render={({ field }) => (
                           <FormItem>
                            <FormLabel>Hour</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent><SelectContent>{generateTimeOptions(24).map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}</SelectContent></SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={control}
                        name="scheduledMinute"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Minute</FormLabel>
                             <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                              <SelectContent><SelectContent>{generateTimeOptions(60).map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></SelectContent>
                            </Select>
                          </FormItem>
                        )}
                      />
                  </div>
                )}
              </fieldset>

              <Button type='submit' size='lg' disabled={isSubmitting || isSent}>
                {isSubmitting ? (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                ) : (
                  <Send className='mr-2 h-4 w-4' />
                )}
                Save Notification
              </Button>
            </form>
          </Form>
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

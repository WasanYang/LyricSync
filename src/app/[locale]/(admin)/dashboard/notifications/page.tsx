// src/app/[locale]/(admin)/dashboard/notifications/page.tsx
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { createNotification } from '@/lib/notifications';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { Send, Loader2 } from 'lucide-react';

const notificationFormSchema = z.object({
  title: z.string().min(1, 'Title is required.'),
  message: z.string().min(1, 'Short message is required.'),
  details: z.string().optional(),
  targetUrl: z.string().url('Please enter a valid URL.').optional().or(z.literal('')),
  recipientType: z.enum(['ALL_USERS', 'SPECIFIC_USERS']),
  recipientIds: z.string().optional(),
});

type NotificationFormValues = z.infer<typeof notificationFormSchema>;

export default function AdminNotificationsPage() {
  const { toast } = useToast();
  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationFormSchema),
    defaultValues: {
      title: '',
      message: '',
      details: '',
      targetUrl: '',
      recipientType: 'ALL_USERS',
      recipientIds: '',
    },
  });

  const {
    formState: { isSubmitting },
    watch,
  } = form;
  const recipientType = watch('recipientType');

  async function onSubmit(data: NotificationFormValues) {
    try {
      await createNotification({
        ...data,
        recipientIds: data.recipientIds
          ?.split(',')
          .map((id) => id.trim())
          .filter(Boolean),
      });
      toast({
        title: 'Notification Sent',
        description: 'The notification has been successfully sent.',
      });
      form.reset();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send notification.',
        variant: 'destructive',
      });
      console.error('Failed to send notification:', error);
    }
  }

  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
        <div className='max-w-2xl mx-auto space-y-8'>
          <div>
            <h1 className='text-3xl font-bold font-headline'>
              Create Notification
            </h1>
            <p className='text-muted-foreground'>
              Send a message to your users.
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <FormField
                control={form.control}
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
                control={form.control}
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
                control={form.control}
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
                control={form.control}
                name='targetUrl'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder='/new-feature-page' {...field} />
                    </FormControl>
                    <FormDescription>
                      The page users will be sent to when they click the
                      notification.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='recipientType'
                render={({ field }) => (
                  <FormItem className='space-y-3'>
                    <FormLabel>Recipients</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className='flex flex-col space-y-1'
                      >
                        <FormItem className='flex items-center space-x-3 space-y-0'>
                          <FormControl>
                            <RadioGroupItem value='ALL_USERS' />
                          </FormControl>
                          <FormLabel className='font-normal'>
                            All Users
                          </FormLabel>
                        </FormItem>
                        <FormItem className='flex items-center space-x-3 space-y-0'>
                          <FormControl>
                            <RadioGroupItem value='SPECIFIC_USERS' />
                          </FormControl>
                          <FormLabel className='font-normal'>
                            Specific Users
                          </FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {recipientType === 'SPECIFIC_USERS' && (
                <FormField
                  control={form.control}
                  name='recipientIds'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>User IDs</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='user_id_1, user_id_2, ...'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Comma-separated list of user IDs to send the
                        notification to.
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
                Send Notification
              </Button>
            </form>
          </Form>
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

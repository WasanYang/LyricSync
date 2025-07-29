'use client';

import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import SEOHead from '@/components/SEOHead';
import { pageSEOConfigs } from '@/lib/seo';

const features = [
  'Unlimited setlist syncing',
  'Access to exclusive arrangements',
  'Advanced player & theme customization',
  'Audio playback & backing tracks (Coming Soon)',
  'Ad-free experience',
];

export default function PremiumPage() {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>(
    'yearly'
  );

  return (
    <>
      <SEOHead config={pageSEOConfigs.premium()} />
      <div className='flex-grow flex flex-col'>
        <Header />
        <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
          <div className='max-w-2xl mx-auto text-center'>
            <div className='w-16 h-16 text-primary mx-auto mb-6 flex items-center justify-center'>
              ⭐
            </div>
            <h1 className='text-4xl sm:text-5xl font-bold font-headline mb-4'>
              Go Premium
            </h1>
            <p className='text-lg text-muted-foreground max-w-2xl mx-auto mb-12'>
              Unlock powerful features to elevate your performance and practice
              sessions.
            </p>
          </div>

          <div className='grid grid-cols-1 md:grid-cols-5 gap-8 items-start'>
            <div className='md:col-span-2 p-8 bg-muted/50 rounded-lg'>
              <h2 className='text-xl font-bold font-headline mb-6'>
                What&apos;s Included:
              </h2>
              <ul className='space-y-4'>
                {features.map((feature, index) => (
                  <li key={index} className='flex items-start gap-3'>
                    <Check className='w-5 h-5 text-green-500 flex-shrink-0 mt-0.5' />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className='md:col-span-3 space-y-6'>
              <Card
                className={cn(
                  'cursor-pointer transition-all',
                  selectedPlan === 'monthly' &&
                    'border-primary ring-2 ring-primary'
                )}
                onClick={() => setSelectedPlan('monthly')}
              >
                <CardHeader className='flex flex-row items-center justify-between'>
                  <div>
                    <CardTitle className='font-headline'>Monthly</CardTitle>
                    <CardDescription>Billed every month</CardDescription>
                  </div>
                  <div className='text-right'>
                    <p className='text-2xl font-bold'>$4.99</p>
                    <p className='text-sm text-muted-foreground'>/ month</p>
                  </div>
                </CardHeader>
              </Card>
              <Card
                className={cn(
                  'cursor-pointer transition-all relative overflow-hidden',
                  selectedPlan === 'yearly' &&
                    'border-primary ring-2 ring-primary'
                )}
                onClick={() => setSelectedPlan('yearly')}
              >
                <div className='absolute top-2 -right-10 bg-primary text-primary-foreground text-xs font-bold px-10 py-1 transform rotate-45'>
                  Save 20%
                </div>
                <CardHeader className='flex flex-row items-center justify-between'>
                  <div>
                    <CardTitle className='font-headline'>Yearly</CardTitle>
                    <CardDescription>Billed once a year</CardDescription>
                  </div>
                  <div className='text-right'>
                    <p className='text-2xl font-bold'>$47.99</p>
                    <p className='text-sm text-muted-foreground'>/ year</p>
                  </div>
                </CardHeader>
              </Card>

              <Button size='lg' className='w-full text-lg'>
                Choose Plan
              </Button>
            </div>
          </div>
        </main>
        <BottomNavBar />
      </div>
    </>
  );
}

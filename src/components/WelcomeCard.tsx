// src/components/WelcomeCard.tsx
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import {
  ListMusic,
  Music,
  X,
  Share,
  PlusCircle,
  ArrowDown,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslations } from 'next-intl';
import { FeatureCard } from '@/app/[locale]/(public)/welcome/component/FeatureCard';

const WELCOME_CARD_DISMISSED_KEY = 'welcomeCardDismissed';

export default function WelcomeCard({ user }: { user: User | null }) {
  const [isDismissed, setIsDismissed] = useState(true);
  const t = useTranslations('welcome');

  useEffect(() => {
    // For new users who are not logged in, always show the card.
    // For logged-in users, respect the dismissed state.
    if (!user) {
      setIsDismissed(false);
    } else {
      const dismissed = localStorage.getItem(WELCOME_CARD_DISMISSED_KEY);
      if (dismissed !== 'true') {
        setIsDismissed(false);
      }
    }
  }, [user]);

  const handleDismiss = () => {
    setIsDismissed(true);
    if (user) {
      localStorage.setItem(WELCOME_CARD_DISMISSED_KEY, 'true');
    }
  };

  function renderContent() {
    if (user && !user.isAnonymous) {
      // Logged-in user
      return (
        <div className='text-center space-y-4'>
          <h1 className='text-3xl font-bold font-headline mb-2'>
            {t('titleBack')}
          </h1>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <Button
              variant='outline'
              size='lg'
              className='justify-start'
              asChild
            >
              <Link href='/setlists'>
                <ListMusic className='mr-3 h-5 w-5' />
                {t('mySetlists')}
              </Link>
            </Button>
            <Button
              variant='outline'
              size='lg'
              className='justify-start'
              asChild
            >
              <Link href='/library'>
                <Music className='mr-3 h-5 w-5' />
                {t('myLibrary')}
              </Link>
            </Button>
          </div>
        </div>
      );
    } else if (user && user.isAnonymous) {
      // Anonymous user
      return (
        <div className='text-center space-y-4'>
          <h1 className='text-3xl font-bold font-headline mb-2'>
            {t('title')}
          </h1>
          <div className='mb-2'>
            <div className='text-base text-muted-foreground'>
              {t('guest')}
            </div>
          </div>
          <div className='mb-2'>
            <span className='text-primary font-semibold block'>
              {t('signIn')}
            </span>
          </div>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button size='lg' asChild>
              <Link href='/login'>
                <span role='img' aria-label='unlock' className='mr-2'>
                  🔓
                </span>
                {t('unlock')}
              </Link>
            </Button>
          </div>
        </div>
      );
    } else {
      // Not logged-in user (New Hero Section)
      return (
        <div className='text-center space-y-12'>
          <div>
            <h1 className='text-4xl sm:text-5xl font-bold font-headline mb-4'>
              {t('title')}
            </h1>
            <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
              {t('desc')}
            </p>
          </div>

          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 text-left'>
            <FeatureCard
              icon={Music}
              title={t('feature1')}
              description={t('feature1Desc')}
            />
            <FeatureCard
              icon={PlusCircle}
              title={t('feature2')}
              description={t('feature2Desc')}
            />
            <FeatureCard
              icon={ArrowDown}
              title={t('feature3')}
              description={t('feature3Desc')}
            />
            <FeatureCard
              icon={Share}
              title={t('feature4')}
              description={t('feature4Desc')}
            />
          </div>

          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button size='lg' asChild>
              <Link href='/login'>{t('getStarted')}</Link>
            </Button>
            <Button variant='outline' size='lg' asChild>
              <Link href='/welcome'>{t('learnMore')}</Link>
            </Button>
          </div>
        </div>
      );
    }
  }

  return (
    <AnimatePresence>
      {(!isDismissed || !user) && (
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className='relative rounded-lg border bg-card text-card-foreground shadow-sm p-6 md:p-10'
        >
          {user && (
            <Button
              variant='ghost'
              size='icon'
              onClick={handleDismiss}
              className='absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground'
            >
              <X className='h-4 w-4' />
              <span className='sr-only'>Dismiss</span>
            </Button>
          )}
          {renderContent()}
        </motion.section>
      )}
    </AnimatePresence>
  );
}

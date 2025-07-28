'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { User } from 'firebase/auth';
import { ListMusic, Music, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useTranslation } from '@/context/LanguageContext';
import en from '@/locales/en';
import th from '@/locales/th';

const WELCOME_CARD_DISMISSED_KEY = 'welcomeCardDismissed';

export default function WelcomeCard({ user }: { user: User | null }) {
  const [isDismissed, setIsDismissed] = useState(true);
  useEffect(() => {
    const dismissed = localStorage.getItem(WELCOME_CARD_DISMISSED_KEY);
    if (dismissed !== 'true') {
      setIsDismissed(false);
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(WELCOME_CARD_DISMISSED_KEY, 'true');
  };

  // i18n: useTranslation context, group welcome
  const { language } = useTranslation();
  const translations = language === 'en' ? en : th;
  const t = translations.welcome;

  function renderContent() {
    if (user && !user.isAnonymous) {
      // Logged-in user
      return (
        <div className='text-center space-y-4'>
          <h1 className='text-3xl font-bold font-headline mb-2'>{t.title}</h1>
          <h2 className='text-lg font-headline mb-4 text-muted-foreground'>
            {t.titleBack}
            {user && user.displayName
              ? `, ${user.displayName.split(' ')[0]}!`
              : '!'}
          </h2>
          <div className='mb-4'>
            {t.titleBack}
            {user && user.displayName
              ? `, ${user.displayName.split(' ')[0]}!`
              : '!'}
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <Button
              variant='outline'
              size='lg'
              className='justify-start'
              asChild
            >
              <Link href='/setlists'>
                <ListMusic className='mr-3 h-5 w-5' />
                {t.mySetlists}
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
                {t.myLibrary}
              </Link>
            </Button>
          </div>
        </div>
      );
    } else if (user && user.isAnonymous) {
      // Anonymous user
      return (
        <div className='text-center space-y-4'>
          <h1 className='text-3xl font-bold font-headline mb-2'>{t.title}</h1>
          <h2 className='text-lg font-headline mb-4 text-muted-foreground'>
            {t.title}
          </h2>
          <div className='mb-2'>
            <div className='text-base mb-1'>{t.guest}</div>
            <div className='text-base text-muted-foreground'>{t.guest}</div>
          </div>
          <div className='mb-2'>
            <span className='text-primary font-semibold block'>{t.signIn}</span>
            <span className='text-primary font-semibold block'>{t.signIn}</span>
          </div>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button size='lg' asChild>
              <Link href='/login'>
                <span role='img' aria-label='unlock' className='mr-2'>
                  🔓
                </span>
                {t.unlock}
              </Link>
            </Button>
          </div>
        </div>
      );
    } else {
      // Not logged-in user
      return (
        <div className='text-center space-y-4'>
          <h1 className='text-3xl font-bold font-headline mb-2'>{t.title}</h1>
          <h2 className='text-lg font-headline mb-4 text-muted-foreground'>
            {t.title}
          </h2>
          <div className='mb-2'>
            <div className='text-base mb-1'>{t.descShort}</div>
          </div>
          <div className='mb-2'>
            <span className='block text-sm text-muted-foreground'>
              {t.forEveryone}
            </span>
          </div>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button size='lg' asChild>
              <Link href='/login'>{t.getStarted}</Link>
            </Button>
            <Button variant='outline' size='lg' asChild>
              <Link href='/welcome'>{t.learnMore}</Link>
            </Button>
          </div>
        </div>
      );
    }
  }

  return (
    <AnimatePresence>
      {!isDismissed && (
        <motion.section
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className='relative rounded-lg border bg-card text-card-foreground shadow-sm p-6'
        >
          <Button
            variant='ghost'
            size='icon'
            onClick={handleDismiss}
            className='absolute top-2 right-2 h-7 w-7 text-muted-foreground hover:text-foreground'
          >
            <X className='h-4 w-4' />
            <span className='sr-only'>Dismiss</span>
          </Button>
          {renderContent()}
        </motion.section>
      )}
    </AnimatePresence>
  );
}

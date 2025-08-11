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
import { useTranslations, useLocale } from 'next-intl';
import { FeatureCard } from '@/app/[locale]/(public)/welcome/component/FeatureCard';
import {
  HowToInstallTH,
  HowToInstallEN,
} from '@/app/[locale]/(public)/welcome/component/HowToInstall';
import type { User } from 'firebase/auth';
import { PWAPromptCard } from './PWAInstallButton';
import LocalsLink from './ui/LocalsLink';

const WELCOME_CARD_DISMISSED_KEY = 'welcomeCardDismissed';

export default function WelcomeCard({ user }: { user: User | null }) {
  const [isDismissed, setIsDismissed] = useState(true);
  const t = useTranslations('welcome');
  const language = useLocale();

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

  function renderLoggedInContent() {
    return (
      <AnimatePresence>
        {!isDismissed && (
          <motion.section
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className='relative rounded-lg border bg-card text-card-foreground shadow-sm p-6 md:p-10'
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
            <div className='text-center space-y-4'>
              <h1 className='text-3xl font-bold font-headline mb-2'>
                {user?.isAnonymous ? t('title') : t('titleBack')}
              </h1>
              {user?.isAnonymous ? (
                <>
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
                      <LocalsLink href='/login'>
                        <span role='img' aria-label='unlock' className='mr-2'>
                          🔓
                        </span>
                        {t('unlock')}
                      </LocalsLink>
                    </Button>
                  </div>
                </>
              ) : (
                <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                  <Button
                    variant='outline'
                    size='lg'
                    className='justify-start'
                    asChild
                  >
                    <LocalsLink href='/my-setlists'>
                      <ListMusic className='mr-3 h-5 w-5' />
                      {t('mySetlists')}
                    </LocalsLink>
                  </Button>
                  <Button
                    variant='outline'
                    size='lg'
                    className='justify-start'
                    asChild
                  >
                    <LocalsLink href='/library'>
                      <Music className='mr-3 h-5 w-5' />
                      {t('myLibrary')}
                    </LocalsLink>
                  </Button>
                </div>
              )}
            </div>
          </motion.section>
        )}
      </AnimatePresence>
    );
  }

  function renderNewUserContent() {
    return (
      <div className='space-y-16 sm:space-y-24'>
        <section className='text-center'>
          <Music className='w-16 h-16 text-primary mx-auto mb-6' />
          <h1 className='text-4xl sm:text-5xl font-bold font-headline mb-4'>
            {t('title')}
          </h1>
          <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
            {t('desc')}
          </p>
        </section>

        <section>
          <h2 className='text-2xl sm:text-3xl font-bold font-headline text-center mb-8 sm:mb-12'>
            {t('coreFeatures')}
          </h2>
          <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8'>
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
        </section>

        <section>
          <h2 className='text-2xl sm:text-3xl font-bold font-headline text-center mb-8 sm:mb-12'>
            {t('howToInstall')}
          </h2>
          {language === 'th' ? <HowToInstallTH /> : <HowToInstallEN />}
        </section>

        <section className='mt-12 max-w-md mx-auto px-4'>
          <PWAPromptCard t={t} />
        </section>

        <section className='text-center'>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button size='lg' asChild>
              <LocalsLink href='/login'>{t('getStarted')}</LocalsLink>
            </Button>
            <Button variant='outline' size='lg' asChild>
              <LocalsLink href='/welcome'>{t('learnMore')}</LocalsLink>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return user ? renderLoggedInContent() : renderNewUserContent();
}

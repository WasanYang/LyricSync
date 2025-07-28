'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from './ui/button';
import { User } from 'firebase/auth';
import { ListMusic, Music, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

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

  const renderContent = () => {
    if (user && !user.isAnonymous) {
      // Logged-in user
      return (
        <div>
          <h1 className='text-2xl font-bold font-headline mb-4'>
            Welcome back,{' '}
            {user.displayName ? user.displayName.split(' ')[0] : 'User'}!
          </h1>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <Button
              variant='outline'
              size='lg'
              className='justify-start'
              asChild
            >
              <Link href='/setlists'>
                <ListMusic className='mr-3 h-5 w-5' /> My Setlists
              </Link>
            </Button>
            <Button
              variant='outline'
              size='lg'
              className='justify-start'
              asChild
            >
              <Link href='/library'>
                <Music className='mr-3 h-5 w-5' /> My Library
              </Link>
            </Button>
          </div>
        </div>
      );
    } else if (user && user.isAnonymous) {
      // Anonymous user
      return (
        <div className='text-center space-y-4'>
          <h1 className='text-3xl font-bold font-headline'>
            Welcome to LyricSync
          </h1>
          <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
            You are using Guest mode.
            <br />
            <span className='text-primary font-semibold'>
              Sign in to save your setlists and unlock all features!
            </span>
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button size='lg' asChild>
              <Link href='/login'>
                <span role='img' aria-label='unlock' className='mr-2'>
                  🔓
                </span>
                Unlock All Features
              </Link>
            </Button>
          </div>
        </div>
      );
    } else {
      // Not logged-in user
      return (
        <div className='text-center space-y-4'>
          <h1 className='text-3xl font-bold font-headline'>
            Welcome to LyricSync
          </h1>
          <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
            A complete worship tool with lyrics, chords, and an auto-play
            system for churches and worship groups.
          </p>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button size='lg' asChild>
              <Link href='/login'>Get Started</Link>
            </Button>
            <Button variant='outline' size='lg' asChild>
              <Link href='/welcome'>Learn More</Link>
            </Button>
          </div>
        </div>
      );
    }
  };

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

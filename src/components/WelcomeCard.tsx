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
          <h1 className='text-2xl font-bold font-headline mb-2'>
            ยินดีต้อนรับกลับสู่ LyricSync
          </h1>
          <h2 className='text-lg font-headline mb-4 text-muted-foreground'>
            Welcome back to LyricSync
            {user.displayName ? `, ${user.displayName.split(' ')[0]}!` : '!'}
          </h2>
          <div className='mb-4'>
            <div className='text-base mb-1'>
              แอปสำหรับซิงค์เนื้อเพลง สร้างเซ็ตลิสต์ แชร์เพลง
              และใช้งานแบบออฟไลน์ได้ทุกที่ ทุกกลุ่ม ทุกศาสนา
            </div>
            <div className='text-base text-muted-foreground'>
              Your inclusive tool for synced lyrics, setlists, sharing, and
              offline access.
            </div>
          </div>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
            <Button
              variant='outline'
              size='lg'
              className='justify-start'
              asChild
            >
              <Link href='/setlists'>
                <ListMusic className='mr-3 h-5 w-5' /> เซ็ตลิสต์ของฉัน{' '}
                <span className='hidden sm:inline'>/ My Setlists</span>
              </Link>
            </Button>
            <Button
              variant='outline'
              size='lg'
              className='justify-start'
              asChild
            >
              <Link href='/library'>
                <Music className='mr-3 h-5 w-5' /> ไลบรารีของฉัน{' '}
                <span className='hidden sm:inline'>/ My Library</span>
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
            ยินดีต้อนรับสู่ LyricSync
          </h1>
          <h2 className='text-lg font-headline mb-4 text-muted-foreground'>
            Welcome to LyricSync
          </h2>
          <div className='mb-2'>
            <div className='text-base mb-1'>คุณกำลังใช้งานโหมด Guest</div>
            <div className='text-base text-muted-foreground'>
              You are using Guest mode.
            </div>
          </div>
          <div className='mb-2'>
            <span className='text-primary font-semibold block'>
              ลงชื่อเข้าใช้เพื่อบันทึกเซ็ตลิสต์และปลดล็อกฟีเจอร์ทั้งหมด!
            </span>
            <span className='text-primary font-semibold block'>
              Sign in to save your setlists and unlock all features!
            </span>
          </div>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button size='lg' asChild>
              <Link href='/login'>
                <span role='img' aria-label='unlock' className='mr-2'>
                  🔓
                </span>
                ปลดล็อกทุกฟีเจอร์{' '}
                <span className='hidden sm:inline'>/ Unlock All Features</span>
              </Link>
            </Button>
          </div>
        </div>
      );
    } else {
      // Not logged-in user
      return (
        <div className='text-center space-y-4'>
          <h1 className='text-3xl font-bold font-headline mb-2'>
            ยินดีต้อนรับสู่ LyricSync
          </h1>
          <h2 className='text-lg font-headline mb-4 text-muted-foreground'>
            Welcome to LyricSync
          </h2>
          <div className='mb-2'>
            <div className='text-base mb-1'>
              แอปสำหรับซิงค์เนื้อเพลง สร้างเซ็ตลิสต์ แชร์เพลง
              และใช้งานแบบออฟไลน์ได้ทุกที่
            </div>
            <div className='text-base text-muted-foreground'>
              Your inclusive tool for synced lyrics, setlists, sharing, and
              offline access.
            </div>
          </div>
          <div className='mb-2'>
            <span className='block text-sm text-muted-foreground'>
              ไม่จำกัดแนวเพลงหรือศาสนา
            </span>
            <span className='block text-sm text-muted-foreground'>
              For everyone, every group, any genre or faith.
            </span>
          </div>
          <div className='flex flex-col sm:flex-row gap-4 justify-center'>
            <Button size='lg' asChild>
              <Link href='/login'>
                เริ่มต้นใช้งาน{' '}
                <span className='hidden sm:inline'>/ Get Started</span>
              </Link>
            </Button>
            <Button variant='outline' size='lg' asChild>
              <Link href='/welcome'>
                ดูรายละเอียด{' '}
                <span className='hidden sm:inline'>/ Learn More</span>
              </Link>
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

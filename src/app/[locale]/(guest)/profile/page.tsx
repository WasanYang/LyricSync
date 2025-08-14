// src/app/[locale]/(guest)/profile/page.tsx
'use client';

import BottomNavBar from '@/components/BottomNavBar';
import ProfileCard from '@/components/ProfileCard';
import { Button } from '@/components/ui/button';
import LocalsLink from '@/components/ui/LocalsLink';
import { Settings, User } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function ProfilePage() {
  const t = useTranslations('profile');
  return (
    <div className='flex-grow flex flex-col'>
      <header className='sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        <div className='container mx-auto flex h-16 items-center justify-between px-4'>
          <div className='flex items-center gap-2'>
            <User className='h-6 w-6' />
            <h1 className='text-2xl font-bold font-headline tracking-tight'>
              {t('title')}
            </h1>
          </div>
          <Button variant='ghost' size='icon' asChild>
            <LocalsLink href='?panel=settings'>
              <Settings className='h-5 w-5' />
              <span className='sr-only'>Settings</span>
            </LocalsLink>
          </Button>
        </div>
      </header>
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
        <div className='max-w-2xl mx-auto'>
          <ProfileCard />
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

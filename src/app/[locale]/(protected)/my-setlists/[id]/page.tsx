'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import { useTranslations } from 'next-intl';
import { SetlistDetailContent } from '../_component/SetlistDetailContent';

export default function SetlistDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const t = useTranslations('setlist');
  return (
    <div className='flex-grow flex flex-col'>
      {user && <Header />}
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8 relative'>
        {user && (
          <Button
            variant='ghost'
            size='icon'
            className='absolute top-4 left-4'
            onClick={() => {
              if (window.history.length > 1) {
                router.back();
              } else {
                router.push('/');
              }
            }}
          >
            <ArrowLeft className='h-5 w-5' />
            <span className='sr-only'>{t('backButton')}</span>
          </Button>
        )}
        <SetlistDetailContent id={id as string} />
      </main>
      {user && <BottomNavBar />}
    </div>
  );
}

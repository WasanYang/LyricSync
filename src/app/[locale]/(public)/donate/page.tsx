'use client';

import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { pageSEOConfigs } from '@/lib/seo';
import DonateCard from '@/components/DonateCard';
import { useTranslations } from 'next-intl';

export default function DonatePage() {
  const t = useTranslations('donate');
  return (
    <>
      <SEOHead config={pageSEOConfigs.donate()} />
      <div className='flex-grow flex flex-col'>
        <Header />
        <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
          <div className='max-w-2xl mx-auto text-center'>
            <div className='w-16 h-16 text-primary mx-auto mb-6 flex items-center justify-center'>
              ❤️
            </div>
            <h1 className='text-4xl sm:text-5xl font-bold font-headline mb-4'>
              {t('title')}
            </h1>
            <p className='text-lg text-muted-foreground max-w-2xl mx-auto mb-12'>
              {t('desc')}
            </p>
          </div>
          <DonateCard t={t} />
        </main>
        <Footer />
        <BottomNavBar />
      </div>
    </>
  );
}

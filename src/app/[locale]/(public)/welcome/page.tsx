'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Music, Share, PlusCircle, ArrowDown, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { PWAPromptCard } from '@/components/PWAInstallButton';
import SEOHead from '@/components/SEOHead';
import { pageSEOConfigs } from '@/lib/seo';
import { useLocale, useTranslations } from 'next-intl';
import { HowToInstallEN, HowToInstallTH } from './component/HowToInstall';
import { FeatureCard } from './component/FeatureCard';
import { usePathname, useRouter } from '@/i18n/navigation';
import LocalsLink from '@/components/ui/LocalsLink';

export default function WelcomePage() {
  const t = useTranslations('welcome');
  const language = useLocale();

  const router = useRouter();
  const { user } = useAuth();

  const handleClose = () => {
    router.push('/');
  };
  const pathname = usePathname();
  const setLanguage = (lang: string) => {
    // เปลี่ยน path locale
    router.replace(pathname, { locale: lang });
  };
  return (
    <>
      <SEOHead config={pageSEOConfigs.welcome()} />
      <div className='bg-background min-h-screen text-foreground relative'>
        {/* Language Switcher */}
        <div className='absolute top-4 left-4 z-20 flex gap-2'>
          <button
            onClick={() => setLanguage('th')}
            className={`px-3 py-1 rounded font-medium border transition-colors duration-150 text-sm ${
              language === 'th'
                ? 'bg-primary text-white border-primary'
                : 'bg-card text-foreground border-border hover:bg-primary/10'
            }`}
            aria-label='เปลี่ยนเป็นภาษาไทย'
          >
            ไทย
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 rounded font-medium border transition-colors duration-150 text-sm ${
              language === 'en'
                ? 'bg-primary text-white border-primary'
                : 'bg-card text-foreground border-border hover:bg-primary/10'
            }`}
            aria-label='Switch to English'
          >
            EN
          </button>
        </div>

        {user && (
          <Button
            variant='ghost'
            size='icon'
            onClick={handleClose}
            className='absolute top-4 right-4 z-10 h-8 w-8'
          >
            <X className='w-5 h-5' />
            <span className='sr-only'>{t('close')}</span>
          </Button>
        )}

        <main className='container mx-auto px-4 py-16 sm:py-24'>
          <section className='text-center mb-10 sm:mb-16'>
            <Music className='w-16 h-16 text-primary mx-auto mb-6' />
            <h1 className='text-4xl sm:text-5xl font-bold font-headline mb-4'>
              {t('title')}
            </h1>
            <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
              {t('welcomeText')}
            </p>
          </section>

          <section className='mb-16 sm:mb-24'>
            <h2 className='text-2xl sm:text-3xl font-bold font-headline text-center mb-8 sm:mb-12'>
              {t('coreFeatures')}
            </h2>
            <div className='grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8'>
              <FeatureCard
                icon={Music}
                title={t('feature1')}
                description={t('feature1Desc')}
              />
              <FeatureCard
                icon={ArrowDown}
                title={t('feature2')}
                description={t('feature2Desc')}
              />
              <FeatureCard
                icon={PlusCircle}
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

          {/* PWA Installation Prompt */}
          <section className='mt-12 max-w-md mx-auto px-4'>
            <PWAPromptCard t={t} />
          </section>

          {!user && (
            <section className='text-center mt-16 sm:mt-24'>
              <Button asChild size='lg'>
                <LocalsLink href='/login'>{t('getStarted')}</LocalsLink>
              </Button>
            </section>
          )}

          <section className='text-center mt-4 mb-6'>
            <Button asChild variant='outline' size='lg'>
              <LocalsLink href='/'>{t('backToHome')}</LocalsLink>
            </Button>
          </section>
        </main>
      </div>
    </>
  );
}

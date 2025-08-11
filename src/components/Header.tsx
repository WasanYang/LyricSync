// src/components/Header.tsx
'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import dynamic from 'next/dynamic';
import { NotificationBell } from './NotificationBell';
import LocalsLink from './ui/LocalsLink';

const HamburgerMenu = dynamic(() => import('./HamburgerMenu'), {
  ssr: false,
});

const OfflineIndicator = dynamic(
  () => import('./OfflineIndicator').then((mod) => mod.OfflineIndicator),
  {
    ssr: false,
  }
);

export default function Header() {
  const t = useTranslations();
  const language = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const setLanguage = (lang: string) => {
    router.replace(pathname, { locale: lang });
  };
  return (
    <header className='sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='flex h-16 items-center justify-between px-4'>
        {/* Title */}
        <div className='flex items-center'>
          <LocalsLink href='/' className='flex items-center space-x-2'>
            <Image
              src='/icons/logo-72.webp'
              alt='LyricSync'
              width={50}
              height={50}
              className='rounded-md'
            />
            <div className='flex flex-col'>
              <span className='font-bold font-headline text-lg leading-tight'>
                LyricSync
              </span>
              <span className='text-xs text-muted-foreground leading-tight hidden sm:block'>
                {t('welcome.desc')}
              </span>
            </div>
          </LocalsLink>
        </div>

        {/* Right side actions */}
        <div className='flex items-center justify-end space-x-1'>
          <NotificationBell />
          <div className='flex items-center'>
            <button
              className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                language === 'th'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => setLanguage('th')}
              aria-label='เปลี่ยนเป็นภาษาไทย'
            >
              ไทย
            </button>
            <span className='mx-1 text-muted-foreground'>|</span>
            <button
              className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                language === 'en'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
              onClick={() => setLanguage('en')}
              aria-label='Switch to English'
            >
              EN
            </button>
          </div>
          <HamburgerMenu />
          <OfflineIndicator showBanner={true} />
        </div>
      </div>
    </header>
  );
}

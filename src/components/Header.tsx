'use client';

import Link from 'next/link';
import { useTheme } from 'next-themes';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import Image from 'next/image';
import { useTranslation } from '@/context/LanguageContext';
import HamburgerMenu from './HamburgerMenu';

export default function Header() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useTranslation();

  return (
    <header className='sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='flex h-16 items-center justify-between px-4'>
        {/* Title */}
        <div className='flex items-center'>
          <Link href='/' className='flex items-center space-x-2'>
            <Image
              src='/logo/logo.png'
              alt='LyricSync'
              width={24}
              height={24}
            />
            <div className='flex flex-col'>
              <span className='font-bold font-headline text-lg leading-tight'>
                LyricSync
              </span>
              <span className='text-xs text-muted-foreground leading-tight hidden sm:block'>
                Synchronized Worship Lyrics
              </span>
            </div>
          </Link>
        </div>

        {/* Right side actions */}
        <div className='flex items-center justify-end space-x-2'>
          <div className='flex items-center hidden'>
            <button
              className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                language === 'th'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-primary'
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
                  ? 'bg-primary text-white'
                  : 'bg-muted text-primary'
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

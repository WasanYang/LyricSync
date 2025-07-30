'use client';

import Link from 'next/link';
import { Separator } from './ui/separator';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

const FooterLink = ({
  href,
  children,
  target = '_self',
}: {
  href: string;
  children: React.ReactNode;
  target?: string;
}) => (
  <li>
    <Link
      href={href}
      target={target}
      className='text-sm text-muted-foreground hover:text-foreground transition-colors'
    >
      {children}
    </Link>
  </li>
);

export default function Footer() {
  const t = useTranslations();
  return (
    <footer className='w-full border-t mt-auto'>
      <div className='max-w-7xl mx-auto px-8 py-12'>
        <div className='grid grid-cols-1 lg:grid-cols-5 gap-8'>
          <div className='lg:col-span-2'>
            <Link href='/' className='flex items-center space-x-2 mb-4'>
              <Image
                src='/icons/logo-192.png'
                alt='LyricSync'
                width={32}
                height={32}
              />
              <span className='font-bold font-headline text-lg'>LyricSync</span>
            </Link>
            <p className='text-sm text-muted-foreground'>{t('longDesc')}</p>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-3 gap-8 lg:col-span-3'>
            <div>
              <h3 className='font-semibold text-foreground mb-4'>
                {t('featuredTitle')}
              </h3>
              <ul className='space-y-3'>
                <FooterLink href='/welcome'>{t('about')}</FooterLink>
                <FooterLink href='/search'>{t('searchAndSetlists')}</FooterLink>
                <FooterLink href='/setlists'>{t('mySetlists')}</FooterLink>
                <FooterLink href='/song-editor'>
                  {t('addAndEditSongs')}
                </FooterLink>
              </ul>
            </div>
            <div>
              <h3 className='font-semibold text-foreground mb-4'>
                {t('contact')}
              </h3>
              <ul className='space-y-3'>
                <FooterLink href='/donate'>{t('donate')}</FooterLink>
                <FooterLink
                  href='https://www.facebook.com/LyricSyncApp'
                  target='_blank'
                >
                  {t('facebookPage')}
                </FooterLink>
              </ul>
            </div>
            <div>
              <h3 className='font-semibold text-foreground mb-4'>
                {t('regal')}
              </h3>
              <ul className='space-y-3'>
                <FooterLink href='/terms-of-use'>{t('termsOfUse')}</FooterLink>
                <FooterLink href='/privacy-policy'>
                  {t('privacyPolicy')}
                </FooterLink>
              </ul>
            </div>
          </div>
        </div>
        <Separator className='my-8' />
        <div className='text-center text-sm text-muted-foreground'>
          © {new Date().getFullYear()} LyricSync. {t('welcome.descShort')}
        </div>
      </div>
    </footer>
  );
}

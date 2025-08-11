'use client';

import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import './globals.css';
import LocalsLink from '@/components/ui/LocalsLink';
export default function NotFound() {
  const pathname = usePathname();
  // Detect locale from path
  let locale: 'th' | 'en' = 'th';
  if (pathname.startsWith('/en')) locale = 'en';

  const texts = {
    th: {
      title: 'ไม่พบหน้าที่คุณต้องการ',
      desc: 'ขออภัย ไม่พบหน้าที่คุณร้องขอ',
      backHome: 'กลับหน้าแรก',
    },
    en: {
      title: 'Page Not Found',
      desc: 'Sorry, the page you are looking for does not exist.',
      backHome: 'Back to Home',
    },
  };
  const t = texts[locale];
  return (
    <div className='flex-grow flex flex-col min-h-screen bg-background'>
      <header className='sticky top-0 z-40 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
        {/* <div className='flex h-16 items-center justify-between px-4 max-w-4xl mx-auto'>
          <Link href='/' className='flex items-center space-x-2'>
            <Image
              src='/icons/logo-72.webp'
              alt='Logo'
              width={72}
              height={72}
              className='rounded-md'
            />
            <span className='font-bold font-headline text-lg'>LyricSync</span>
          </Link>
        </div> */}
      </header>
      <main className='flex-grow flex items-center justify-center'>
        <div className='text-center p-8'>
          <h1 className='text-8xl font-bold text-primary font-mono'>404</h1>
          <h2 className='mt-4 text-2xl font-headline font-semibold text-foreground'>
            {t.title}
          </h2>
          <p className='mt-2 text-muted-foreground'>{t.desc}</p>
          <div className='mt-6'>
            <Button asChild size='lg'>
              <LocalsLink href={locale === 'en' ? '/en' : '/'}>
                <Home className='mr-2 h-4 w-4' /> {t.backHome}
              </LocalsLink>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}

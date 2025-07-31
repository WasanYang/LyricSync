import '../globals.css';
import { cn } from '@/lib/utils';
import { viewport } from '../metadata';
import { RootLayoutClient } from '@/components/RootLayoutClient';
import { NextIntlClientProvider } from 'next-intl';

import { generateMetadata as buildMetadata, pageSEOConfigs } from '@/lib/seo';

export { viewport };

// Dynamic SEO metadata by locale
import { getTranslations } from 'next-intl/server';

export async function generateMetadata({
  params,
}: {
  params: { lang: string };
}) {
  const lang = params.lang;
  const t = await getTranslations({ locale: lang, namespace: 'welcome' });
  const title = t('title');
  const description = t('descShort');
  return buildMetadata({
    title,
    description,
    keywords: [title, 'LyricSync'],
    openGraph: {
      title,
      description,
      images: [
        {
          url: '/icons/logo-512.png',
          width: 512,
          height: 512,
          alt: 'LyricSync Logo',
        },
      ],
      siteName: 'LyricSync',
      locale: lang === 'en' ? 'en_US' : 'th_TH',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/icons/logo-512.png'],
      creator: '@lyricsync',
      site: '@lyricsync',
    },
    alternates: {
      canonical:
        lang === 'en' ? 'https://lyricsync.app/en' : 'https://lyricsync.app',
      languages: {
        'th-TH': 'https://lyricsync.app',
        'en-US': 'https://lyricsync.app/en',
      },
    },
  });
}

export default function RootLayout({
  children,
  params: { lang },
}: Readonly<{
  children: React.ReactNode;
  params: { lang: string };
}>) {
  return (
    <html lang={lang} suppressHydrationWarning>
      <body
        className={cn(
          'font-body antialiased min-h-screen flex flex-col bg-background'
        )}
      >
        <NextIntlClientProvider locale={lang}>
          <RootLayoutClient>
            <div className='w-full max-w-[768px] mx-auto flex-grow flex flex-col'>
              <div className='flex-grow flex flex-col pb-16 md:pb-0'>
                {children}
              </div>
            </div>
          </RootLayoutClient>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

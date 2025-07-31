import './globals.css';
import { cn } from '@/lib/utils';
import { NextIntlClientProvider } from 'next-intl';
import { viewport } from './metadata';
import { RootLayoutClient } from '@/components/RootLayoutClient';

export { viewport };

export const metadata = {
  title: 'LyricSync - Your App Title',
  description: 'คำอธิบายเว็บไซต์',
  keywords: ['LyricSync', 'Lyrics', 'Music'],
  openGraph: {
    title: 'LyricSync - Your App Title',
    description: 'คำอธิบายเว็บไซต์',
    images: [
      {
        url: 'https://lyricsync.app/icons/logo-512.png',
        width: 512,
        height: 512,
        alt: 'LyricSync Logo',
      },
    ],
    siteName: 'LyricSync',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LyricSync - Your App Title',
    description: 'คำอธิบายเว็บไซต์',
    images: ['/icons/logo-512.png'],
    creator: '@lyricsync',
    site: '@lyricsync',
  },
  alternates: {
    canonical: 'https://lyricsync.app',
    languages: {
      'th-TH': 'https://lyricsync.app',
      'en-US': 'https://lyricsync.app/en',
    },
  },
};
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

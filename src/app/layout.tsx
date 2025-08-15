import './globals.css';
import { cn } from '@/lib/utils';
import { viewport, metadata } from './metadata';
import { use } from 'react';
import { Inter } from 'next/font/google';

export { viewport, metadata };

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
});

export default function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale = 'th' } = use(params);
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel='preconnect' href='https://apis.google.com' />
        <link rel='preconnect' href='https://firestore.googleapis.com' />
        <link rel='preconnect' href='https://placehold.co' />
      </head>
      <body
        className={cn(
          'font-body antialiased min-h-screen flex flex-col bg-background',
          inter.variable
        )}
      >
        <div className='w-full max-w-[768px] mx-auto flex-grow flex flex-col'>
          {children}
        </div>
      </body>
    </html>
  );
}

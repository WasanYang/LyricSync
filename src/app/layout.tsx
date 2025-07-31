import './globals.css';
import { cn } from '@/lib/utils';
import { RootLayoutClient } from '@/components/RootLayoutClient';
import { NextIntlClientProvider } from 'next-intl';
import { viewport } from './metadata';

export { viewport };

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

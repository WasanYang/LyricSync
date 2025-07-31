import '../globals.css';
import { NextIntlClientProvider } from 'next-intl';
import { RootLayoutClient } from '@/components/RootLayoutClient';

export default function RootLayout({
  children,
  params: { lang },
}: Readonly<{
  children: React.ReactNode;
  params: { lang: string };
}>) {
  return (
    <NextIntlClientProvider locale={lang}>
      <RootLayoutClient>
        <div className='w-full max-w-[768px] mx-auto flex-grow flex flex-col'>
          <div className='flex-grow flex flex-col pb-16 md:pb-0'>
            {children}
          </div>
        </div>
      </RootLayoutClient>
    </NextIntlClientProvider>
  );
}

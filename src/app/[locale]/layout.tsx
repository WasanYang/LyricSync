import '../globals.css';
import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl';
import { RootLayoutClient } from '@/components/RootLayoutClient';
import {
  generateMetadata as generateSEOMetadata,
  pageSEOConfigs,
} from '@/lib/seo';
import { notFound } from 'next/navigation';

export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = await params;
  return generateSEOMetadata(pageSEOConfigs.home(locale || 'th'));
}

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const { locale } = await params;
  let messages: AbstractIntlMessages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <div className='w-full max-w-[768px] mx-auto flex-grow flex flex-col'>
        <RootLayoutClient>
          <div className='flex-grow flex flex-col pb-24 md:pb-0'>
            {children}
          </div>
        </RootLayoutClient>
      </div>
    </NextIntlClientProvider>
  );
}

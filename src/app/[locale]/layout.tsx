import '../globals.css';
import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl';
import { RootLayoutClient } from '@/components/RootLayoutClient';
import React from 'react';
import { notFound } from 'next/navigation';

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
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
      <RootLayoutClient>
        <div className='flex-grow flex flex-col pb-24 md:pb-0'>{children}</div>
      </RootLayoutClient>
    </NextIntlClientProvider>
  );
}

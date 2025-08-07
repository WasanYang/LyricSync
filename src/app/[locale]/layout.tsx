
// src/app/[locale]/layout.tsx
'use client';
import '../globals.css';
import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl';
import { RootLayoutClient } from '@/components/RootLayoutClient';
import React, { useState, useEffect } from 'react';

export default function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const { locale } = params;
  const [messages, setMessages] = useState<AbstractIntlMessages | null>(null);

  useEffect(() => {
    import(`../../messages/${locale}.json`)
      .then((mod) => setMessages(mod.default))
      .catch(() => console.error(`Failed to load messages for locale: ${locale}`));
  }, [locale]);

  if (!messages) {
    return (
        <div className='flex h-screen items-center justify-center'>
          <div className='text-center'>
            <div className='h-16 w-16 mx-auto mb-4 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
            <p className='text-muted-foreground'>Loading...</p>
          </div>
        </div>
    );
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <RootLayoutClient>
        <div className='flex-grow flex flex-col pb-24 md:pb-0'>
          {children}
        </div>
      </RootLayoutClient>
    </NextIntlClientProvider>
  );
}

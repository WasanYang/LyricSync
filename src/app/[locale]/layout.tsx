'use client';

import '../globals.css';
import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl';
import { RootLayoutClient } from '@/components/RootLayoutClient';
import React, { use, useEffect, useState } from 'react';
import { notFound } from 'next/navigation';
import { Provider } from 'react-redux';
import { store } from '@/store/store';
import thMessages from '@/messages/th.json';

export default function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const { locale = 'th' } = use(params);
  const [messages, setMessages] = useState<AbstractIntlMessages | null>(null);

  useEffect(() => {
    let isMounted = true;
    import(`../../messages/${locale}.json`)
      .then((mod) => {
        if (isMounted) setMessages(mod.default);
      })
      .catch(() => {
        notFound();
      });
    return () => {
      isMounted = false;
    };
  }, [locale]);

  return (
    <NextIntlClientProvider locale={locale} messages={messages || thMessages}>
      <Provider store={store}>
        <RootLayoutClient>
          <div className='flex-grow flex flex-col pb-24 md:pb-0'>
            {children}
          </div>
        </RootLayoutClient>
      </Provider>
    </NextIntlClientProvider>
  );
}

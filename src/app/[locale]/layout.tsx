// src/app/[locale]/layout.tsx
'use client';
import '../globals.css';
import { NextIntlClientProvider, AbstractIntlMessages } from 'next-intl';
import { RootLayoutClient } from '@/components/RootLayoutClient';
import React, { useState, useEffect } from 'react';

// NOTE: We can't use generateMetadata here because this is now a client component.
// Metadata will be handled by the root layout in src/app/layout.tsx.

export default function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const { locale } = React.use(params);
  const [messages, setMessages] = useState<AbstractIntlMessages | null>(null);

  useEffect(() => {
    // Dynamically import messages on the client to avoid hydration issues
    // with server/client mismatch on what messages are available.
    import(`../../messages/${locale}.json`)
      .then((mod) => setMessages(mod.default))
      .catch(() => console.error(`Failed to load messages for locale: ${locale}`));
  }, [locale]);

  if (!messages) {
    // You can render a loading state here if you want
    return null;
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

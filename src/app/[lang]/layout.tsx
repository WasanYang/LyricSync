import '../globals.css';
import { cn } from '@/lib/utils';
import { metadata, viewport } from '../metadata';
import { RootLayoutClient } from '@/components/RootLayoutClient';
import { IntlProvider } from 'next-intl';

export { metadata, viewport };

export default function RootLayout({
  children,
  params: { lang },
}: Readonly<{
  children: React.ReactNode;
  params: { lang: string };
}>) {
  const messages = require(`../../messages/${lang}.json`);

  return (
    <html lang='th' suppressHydrationWarning>
      <header>
        <meta
          name='facebook-domain-verification'
          content='ezi8uf5pzd9mm1sdp0m8wdpwgr56pn'
        />
      </header>
      <body
        className={cn(
          'font-body antialiased min-h-screen flex flex-col bg-background'
        )}
      >
        <IntlProvider messages={messages} locale={lang}>
          <RootLayoutClient>
            <div className='w-full max-w-[768px] mx-auto flex-grow flex flex-col'>
              <div className='flex-grow flex flex-col pb-16 md:pb-0'>
                {children}
              </div>
            </div>
          </RootLayoutClient>
        </IntlProvider>
      </body>
    </html>
  );
}

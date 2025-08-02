import './globals.css';
import { cn } from '@/lib/utils';
import { viewport, metadata } from './metadata';

export { viewport, metadata };

export default async function RootLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: { locale: string };
}>) {
  const { locale = 'th' } = await params;
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel='preconnect' href='https://apis.google.com' />
        <link rel='preconnect' href='https://firestore.googleapis.com' />
        <link rel='preconnect' href='https://placehold.co' />
        <meta property='fb:app_id' content='1136346271737388' />
      </head>
      <body
        className={cn(
          'font-body antialiased min-h-screen flex flex-col bg-background'
        )}
      >
        {children}
      </body>
    </html>
  );
}

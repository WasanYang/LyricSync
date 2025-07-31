import './globals.css';
import { cn } from '@/lib/utils';
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
        {children}
      </body>
    </html>
  );
}

// src/app/layout.tsx
import './globals.css';
import { LanguageProvider } from '../context/LanguageContext';
import { cn } from '@/lib/utils';
import { metadata, viewport } from './metadata';
import { RootLayoutClient } from '@/components/RootLayoutClient';

// Export metadata and viewport for Next.js App Router
export { metadata, viewport };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='th' suppressHydrationWarning>
      <body
        className={cn(
          'font-body antialiased min-h-screen flex flex-col bg-background'
        )}
      >
        <LanguageProvider>
          <RootLayoutClient>
            <div className='w-full max-w-[768px] mx-auto flex-grow flex flex-col'>
              <div className='flex-grow flex flex-col pb-16 md:pb-0'>
                {children}
              </div>
            </div>
          </RootLayoutClient>
        </LanguageProvider>
      </body>
    </html>
  );
}

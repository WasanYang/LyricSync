import type { Metadata } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'Rhythmic Reads',
  description: 'A PWA for synchronized song lyrics with auto-scrolling.',
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#9400D3" />
      </head>
      <body className={cn('font-body antialiased min-h-screen flex flex-col bg-background')}>
        <div className="w-full max-w-[768px] mx-auto flex-grow flex flex-col">
          {children}
        </div>
        <Toaster />
      </body>
    </html>
  );
}

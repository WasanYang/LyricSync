// src/app/layout.tsx
'use client';

import type { Metadata, Viewport } from 'next';
import './globals.css';
import { cn } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/context/AuthContext';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { useEffect, useState } from 'react';
import Footer from '@/components/Footer';

// Metadata cannot be exported from a client component.
// We can define it here and then use it in the component.
const metadataConfig: Metadata = {
  title: 'Rhythmic Reads',
  description: 'A PWA for synchronized song lyrics with auto-scrolling.',
  manifest: '/manifest.json',
};

const viewportConfig: Viewport = {
  themeColor: '#3AAFA9',
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isOnline = useOnlineStatus();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.classList.toggle('is-offline', !isOnline);
  }, [isOnline]);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>{String(metadataConfig.title)}</title>
        {metadataConfig.description && <meta name="description" content={metadataConfig.description} />}
        {metadataConfig.manifest && <link rel="manifest" href={String(metadataConfig.manifest)} />}
        {viewportConfig.themeColor && <meta name="theme-color" content={String(viewportConfig.themeColor)} />}
        
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn('font-body antialiased min-h-screen flex flex-col bg-background')}>
         <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <div className="w-full max-w-[768px] mx-auto flex-grow flex flex-col">
                {children}
              </div>
              <Toaster />
              <Footer />
            </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

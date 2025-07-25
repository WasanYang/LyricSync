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
import { registerSW } from '@/lib/pwa';
import { iOSUtils } from '@/lib/ios-utils';
import { IOSErrorBoundary } from '@/components/IOSErrorBoundary';

// Metadata cannot be exported from a client component.
// We can define it here and then use it in the component.
const metadataConfig: Metadata = {
  title: 'LyricSync',
  description:
    'Synchronized worship song lyrics with auto-scrolling, chord display, and setlist management.',
  manifest: '/manifest.json',
};

const viewportConfig: Viewport = {
  themeColor: '#3AAFA9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
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

    // Initialize iOS-specific fixes
    iOSUtils.init();

    // Register service worker for PWA
    if (process.env.NODE_ENV === 'production') {
      registerSW();
    }
  }, [isOnline]);

  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <title>{String(metadataConfig.title)}</title>
        {metadataConfig.description && (
          <meta name='description' content={metadataConfig.description} />
        )}
        {metadataConfig.manifest && (
          <link rel='manifest' href={String(metadataConfig.manifest)} />
        )}
        {viewportConfig.themeColor && (
          <meta
            name='theme-color'
            content={String(viewportConfig.themeColor)}
          />
        )}

        {/* iOS specific meta tags */}
        <meta name='apple-mobile-web-app-capable' content='yes' />
        <meta name='apple-mobile-web-app-status-bar-style' content='default' />
        <meta name='apple-mobile-web-app-title' content='LyricSync' />
        <meta name='format-detection' content='telephone=no' />
        <link rel='apple-touch-icon' href='/logo/logo.png' />

        {/* Viewport meta tag */}
        <meta
          name='viewport'
          content={`width=${viewportConfig.width}, initial-scale=${
            viewportConfig.initialScale
          }, maximum-scale=${viewportConfig.maximumScale}, user-scalable=${
            viewportConfig.userScalable ? 'yes' : 'no'
          }, viewport-fit=${viewportConfig.viewportFit}`}
        />
      </head>
      <body
        className={cn(
          'font-body antialiased min-h-screen flex flex-col bg-background'
        )}
      >
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <IOSErrorBoundary>
            <AuthProvider>
              <div className='w-full max-w-[768px] mx-auto flex-grow flex flex-col'>
                <div className='flex-grow flex flex-col pb-16 md:pb-0'>
                  {children}
                </div>
              </div>
              <Toaster />
            </AuthProvider>
          </IOSErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}

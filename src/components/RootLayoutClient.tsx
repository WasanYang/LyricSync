'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { useEffect } from 'react';
import { registerSW } from '@/lib/pwa';
import { iOSUtils } from '@/lib/ios-utils';
import { IOSErrorBoundary } from '@/components/IOSErrorBoundary';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';
import { ClientOnly } from './shared/ClientOnly';
import HamburgerMenu from './HamburgerMenu';

interface RootLayoutClientProps {
  children: React.ReactNode;
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
  // const isOnline = useOnlineStatus();

  // useEffect(() => {
  //   document.documentElement.classList.toggle('is-offline', !isOnline);
  // }, [isOnline]);

  useEffect(() => {
    // Initialize iOS-specific fixes
    iOSUtils.init();

    // Register service worker for PWA
    if (process.env.NODE_ENV === 'production') {
      registerSW();
    }
  }, []);

  return (
    <ClientOnly>
      <IOSErrorBoundary>
        <ThemeProvider
          attribute='class'
          defaultTheme='system'
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
            <HamburgerMenu />
          </AuthProvider>
        </ThemeProvider>
      </IOSErrorBoundary>
    </ClientOnly>
  );
}

'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { useEffect, useState } from 'react';
import { registerSW } from '@/lib/pwa';
import { iOSUtils } from '@/lib/ios-utils';
import { IOSErrorBoundary } from '@/components/IOSErrorBoundary';
import { ThemeProvider } from '@/components/ThemeProvider';
import { AuthProvider } from '@/context/AuthContext';
import { Toaster } from '@/components/ui/toaster';

interface RootLayoutClientProps {
  children: React.ReactNode;
}

export function RootLayoutClient({ children }: RootLayoutClientProps) {
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

  // Show loading state during hydration to prevent mismatch
  if (!mounted) {
    return (
      <html lang='th' suppressHydrationWarning>
        <body>
            <div className='flex h-screen items-center justify-center'>
              <div className='text-center'>
                <div className='h-32 w-32 mx-auto mb-4 animate-spin rounded-full border-4 border-primary border-t-transparent'></div>
                <p className='text-muted-foreground'>กำลังโหลด...</p>
              </div>
            </div>
        </body>
      </html>
    );
  }

  return (
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
        </AuthProvider>
      </ThemeProvider>
    </IOSErrorBoundary>
  );
}

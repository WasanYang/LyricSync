// iOS/Safari compatibility utilities
export const iOSUtils = {
  // Detect iOS
  isIOS(): boolean {
    return (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    );
  },

  // Detect Safari
  isSafari(): boolean {
    return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  },

  // Check if running as PWA on iOS
  isIOSPWA(): boolean {
    return this.isIOS() && (window.navigator as any).standalone === true;
  },

  // Fix iOS viewport issues
  fixIOSViewport(): void {
    if (this.isIOS()) {
      // Add iOS class to body for CSS targeting
      document.body.classList.add('ios-device');

      // Prevent zoom on input focus
      document.addEventListener('touchstart', () => {}, { passive: true });

      // Fix 100vh issue on iOS
      const setVH = () => {
        const vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
      };

      setVH();
      window.addEventListener('resize', setVH);
      window.addEventListener('orientationchange', () => {
        setTimeout(setVH, 100);
      });
    } else {
      // Remove iOS class if not iOS
      document.body.classList.remove('ios-device');
    }
  },

  // Enable/disable iOS bounce prevention
  setBouncePrevention(enabled: boolean): void {
    if (this.isIOS()) {
      if (enabled) {
        document.body.classList.add('prevent-bounce');
      } else {
        document.body.classList.remove('prevent-bounce');
      }
    }
  },

  // Force scroll to top (useful for iOS navigation)
  scrollToTop(smooth = true): void {
    window.scrollTo({
      top: 0,
      behavior: smooth ? 'smooth' : 'auto',
    });
  },

  // Check if page is scrollable
  isPageScrollable(): boolean {
    return (
      document.documentElement.scrollHeight >
      document.documentElement.clientHeight
    );
  },

  // Handle iOS-specific errors
  handleIOSError(error: any): string {
    if (this.isIOS()) {
      // Common iOS-specific error handling
      if (
        error.code === 'storage/unauthorized' ||
        error.code === 'permission-denied'
      ) {
        return 'Storage access denied. Please check your Safari settings.';
      }

      if (error.code === 'network-request-failed') {
        return 'Network error. Please check your connection and try again.';
      }

      if (error.message?.includes('IndexedDB')) {
        return 'Local storage unavailable. Data will not be cached offline.';
      }

      if (error.message?.includes('ServiceWorker')) {
        return 'Service Worker not supported. Some offline features may not work.';
      }
    }

    return error.message || 'An unexpected error occurred';
  },

  // iOS-safe localStorage wrapper
  safeLocalStorage: {
    getItem(key: string): string | null {
      try {
        return localStorage.getItem(key);
      } catch (error) {
        console.warn('localStorage access failed on iOS:', error);
        return null;
      }
    },

    setItem(key: string, value: string): boolean {
      try {
        localStorage.setItem(key, value);
        return true;
      } catch (error) {
        console.warn('localStorage write failed on iOS:', error);
        return false;
      }
    },

    removeItem(key: string): boolean {
      try {
        localStorage.removeItem(key);
        return true;
      } catch (error) {
        console.warn('localStorage remove failed on iOS:', error);
        return false;
      }
    },
  },

  // Check iOS Safari private mode
  isPrivateMode(): Promise<boolean> {
    return new Promise((resolve) => {
      if (!this.isSafari()) {
        resolve(false);
        return;
      }

      try {
        localStorage.setItem('__test__', 'test');
        localStorage.removeItem('__test__');
        resolve(false);
      } catch (error) {
        resolve(true);
      }
    });
  },

  // Initialize iOS-specific fixes
  init(): void {
    if (typeof window === 'undefined') return;

    this.fixIOSViewport();

    // Log iOS-specific info
    if (this.isIOS()) {
      console.log('iOS detected:', {
        isIOSPWA: this.isIOSPWA(),
        isSafari: this.isSafari(),
        userAgent: navigator.userAgent,
      });

      // Check for private mode
      this.isPrivateMode().then((isPrivate) => {
        if (isPrivate) {
          console.warn(
            'iOS Safari Private Mode detected - some features may be limited'
          );
        }
      });
    }
  },
};

// Auto-initialize on import
if (typeof window !== 'undefined') {
  iOSUtils.init();
}

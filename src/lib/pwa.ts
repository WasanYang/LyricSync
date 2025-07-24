// PWA utilities for service worker registration and management
export const PWA_CONSTANTS = {
  SW_URL: '/sw.js',
  CACHE_NAME: 'lyricsync-v1',
  OFFLINE_URL: '/offline',
} as const;

// Register service worker
export async function registerSW(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    console.warn('[PWA] Service Worker not supported');
    return null;
  }

  try {
    const registration = await navigator.serviceWorker.register(
      PWA_CONSTANTS.SW_URL,
      {
        scope: '/',
      }
    );

    console.log('[PWA] Service Worker registered successfully:', registration);

    // Handle updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (
            newWorker.state === 'installed' &&
            navigator.serviceWorker.controller
          ) {
            // New content is available
            showUpdateAvailable();
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.error('[PWA] Service Worker registration failed:', error);
    return null;
  }
}

// Show update notification
function showUpdateAvailable() {
  if (confirm('New version available! Click OK to update.')) {
    window.location.reload();
  }
}

// Unregister service worker
export async function unregisterSW(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return false;
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      await registration.unregister();
      console.log('[PWA] Service Worker unregistered');
      return true;
    }
    return false;
  } catch (error) {
    console.error('[PWA] Service Worker unregistration failed:', error);
    return false;
  }
}

// Check if app is installed as PWA
export function isPWAInstalled(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as any).standalone === true
  );
}

// Prompt PWA installation
export function promptPWAInstall(): Promise<boolean> {
  return new Promise((resolve) => {
    const deferredPrompt = (window as any).deferredPrompt;

    if (!deferredPrompt) {
      console.warn('[PWA] Install prompt not available');
      resolve(false);
      return;
    }

    deferredPrompt.prompt();

    deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
      if (choiceResult.outcome === 'accepted') {
        console.log('[PWA] User accepted install prompt');
        resolve(true);
      } else {
        console.log('[PWA] User dismissed install prompt');
        resolve(false);
      }

      (window as any).deferredPrompt = null;
    });
  });
}

// Cache specific URLs
export async function cacheUrls(urls: string[]): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration && registration.active) {
    registration.active.postMessage({
      type: 'CACHE_URLS',
      data: { urls },
    });
  }
}

// Clear all caches
export async function clearCaches(): Promise<void> {
  const registration = await navigator.serviceWorker.getRegistration();
  if (registration && registration.active) {
    registration.active.postMessage({
      type: 'CLEAR_CACHE',
    });
  }
}

// Listen for SW messages
export function addSWMessageListener(
  callback: (event: MessageEvent) => void
): () => void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return () => {};
  }

  navigator.serviceWorker.addEventListener('message', callback);

  return () => {
    navigator.serviceWorker.removeEventListener('message', callback);
  };
}

// PWA installation hook
export function usePWAInstall() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    setIsInstalled(isPWAInstalled());

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      (window as any).deferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener(
        'beforeinstallprompt',
        handleBeforeInstallPrompt
      );
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  return {
    isInstallable,
    isInstalled,
    install: promptPWAInstall,
  };
}

// React imports for hooks
import { useEffect, useState } from 'react';

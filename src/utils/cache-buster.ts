// src/utils/cache-buster.ts
export function clearCacheAndReload() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      registrations.forEach((registration) => {
        registration.unregister();
      });
    });
  }

  // Clear all cache storage
  if ('caches' in window) {
    caches.keys().then((names) => {
      names.forEach((name) => {
        caches.delete(name);
      });
    });
  }

  // Force reload
  window.location.reload();
}

// Add version check
export function checkAppVersion() {
  const currentVersion = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
  const storedVersion = localStorage.getItem('app_version');

  if (storedVersion !== currentVersion) {
    localStorage.setItem('app_version', currentVersion);
    clearCacheAndReload();
  }
}

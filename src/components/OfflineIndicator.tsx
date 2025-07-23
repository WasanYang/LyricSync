import { useState, useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface OfflineIndicatorProps {
  showBanner?: boolean;
}

export function OfflineIndicator({ showBanner = true }: OfflineIndicatorProps) {
  const isOnline = useOnlineStatus();
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);

  useEffect(() => {
    if (!isOnline && showBanner) {
      setShowOfflineAlert(true);
      const timer = setTimeout(() => {
        setShowOfflineAlert(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, showBanner]);

  if (!showBanner) return null;

  return (
    <>
      {showOfflineAlert && !isOnline && (
        <div className='fixed top-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96'>
          <Alert className='border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200'>
            <AlertTriangle className='h-4 w-4' />
            <AlertDescription>
              You're offline. Some features may be limited, but saved songs and
              setlists are still available.
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Status indicator in header */}
      <div className='flex items-center gap-1'>
        {isOnline ? (
          <div className='h-2 w-2 rounded-full bg-green-500' />
        ) : (
          <div className='h-2 w-2 rounded-full bg-amber-500' />
        )}
        <span className='text-xs text-muted-foreground sr-only'>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    </>
  );
}

export function useOfflineCapabilities() {
  const isOnline = useOnlineStatus();

  return {
    isOnline,
    canSync: isOnline,
    canLoadCloudData: isOnline,
    showOfflineWarning: !isOnline,
  };
}

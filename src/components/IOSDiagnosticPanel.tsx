'use client';

import { useState, useEffect } from 'react';
import { iOSUtils } from '@/lib/ios-utils';
import { useOnlineStatus } from '@/hooks/use-online-status';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface IOSDiagnostics {
  isIOS: boolean;
  isSafari: boolean;
  isIOSPWA: boolean;
  isPrivateMode: boolean | null;
  userAgent: string;
  viewportSize: { width: number; height: number };
  devicePixelRatio: number;
  touchSupport: boolean;
  localStorageSupported: boolean;
  indexedDBSupported: boolean;
  serviceWorkerSupported: boolean;
}

export function IOSDiagnosticPanel() {
  const isOnline = useOnlineStatus();
  const [diagnostics, setDiagnostics] = useState<IOSDiagnostics | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const runDiagnostics = async () => {
    setIsChecking(true);

    try {
      const isPrivateMode = await iOSUtils.isPrivateMode();

      const diagnostics: IOSDiagnostics = {
        isIOS: iOSUtils.isIOS(),
        isSafari: iOSUtils.isSafari(),
        isIOSPWA: iOSUtils.isIOSPWA(),
        isPrivateMode,
        userAgent: navigator.userAgent,
        viewportSize: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        devicePixelRatio: window.devicePixelRatio,
        touchSupport: 'ontouchstart' in window,
        localStorageSupported: (() => {
          try {
            localStorage.setItem('__test__', 'test');
            localStorage.removeItem('__test__');
            return true;
          } catch {
            return false;
          }
        })(),
        indexedDBSupported: 'indexedDB' in window,
        serviceWorkerSupported: 'serviceWorker' in navigator,
      };

      setDiagnostics(diagnostics);
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runDiagnostics();
  }, []);

  if (!diagnostics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>iOS Diagnostics</CardTitle>
          <CardDescription>
            {isChecking ? 'Running diagnostics...' : 'Loading...'}
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          📱 iOS Diagnostics
          {diagnostics.isIOS && <Badge variant='default'>iOS Detected</Badge>}
        </CardTitle>
        <CardDescription>
          Device and browser compatibility information
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Platform Detection */}
        <div className='grid grid-cols-2 gap-4'>
          <div className='space-y-2'>
            <h4 className='text-sm font-medium'>Platform</h4>
            <div className='space-y-1 text-xs'>
              <div className='flex justify-between'>
                <span>iOS:</span>
                <Badge variant={diagnostics.isIOS ? 'default' : 'secondary'}>
                  {diagnostics.isIOS ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className='flex justify-between'>
                <span>Safari:</span>
                <Badge variant={diagnostics.isSafari ? 'default' : 'secondary'}>
                  {diagnostics.isSafari ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className='flex justify-between'>
                <span>PWA Mode:</span>
                <Badge variant={diagnostics.isIOSPWA ? 'default' : 'secondary'}>
                  {diagnostics.isIOSPWA ? 'Yes' : 'No'}
                </Badge>
              </div>
              <div className='flex justify-between'>
                <span>Private Mode:</span>
                <Badge
                  variant={
                    diagnostics.isPrivateMode ? 'destructive' : 'default'
                  }
                >
                  {diagnostics.isPrivateMode === null
                    ? 'Unknown'
                    : diagnostics.isPrivateMode
                    ? 'Yes'
                    : 'No'}
                </Badge>
              </div>
            </div>
          </div>

          <div className='space-y-2'>
            <h4 className='text-sm font-medium'>Device Info</h4>
            <div className='space-y-1 text-xs'>
              <div>
                <span className='text-muted-foreground'>Viewport:</span>
                <br />
                {diagnostics.viewportSize.width} ×{' '}
                {diagnostics.viewportSize.height}
              </div>
              <div>
                <span className='text-muted-foreground'>Pixel Ratio:</span>
                <br />
                {diagnostics.devicePixelRatio}
              </div>
              <div className='flex justify-between'>
                <span>Touch:</span>
                <Badge
                  variant={diagnostics.touchSupport ? 'default' : 'secondary'}
                >
                  {diagnostics.touchSupport ? 'Yes' : 'No'}
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Support */}
        <div className='space-y-2'>
          <h4 className='text-sm font-medium'>Feature Support</h4>
          <div className='grid grid-cols-2 gap-2 text-xs'>
            <div className='flex justify-between'>
              <span>LocalStorage:</span>
              <Badge
                variant={
                  diagnostics.localStorageSupported ? 'default' : 'destructive'
                }
              >
                {diagnostics.localStorageSupported ? '✓' : '✗'}
              </Badge>
            </div>
            <div className='flex justify-between'>
              <span>IndexedDB:</span>
              <Badge
                variant={
                  diagnostics.indexedDBSupported ? 'default' : 'destructive'
                }
              >
                {diagnostics.indexedDBSupported ? '✓' : '✗'}
              </Badge>
            </div>
            <div className='flex justify-between'>
              <span>Service Worker:</span>
              <Badge
                variant={
                  diagnostics.serviceWorkerSupported ? 'default' : 'destructive'
                }
              >
                {diagnostics.serviceWorkerSupported ? '✓' : '✗'}
              </Badge>
            </div>
            <div className='flex justify-between'>
              <span>Network:</span>
              <Badge variant={isOnline ? 'default' : 'destructive'}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
          </div>
        </div>

        {/* User Agent */}
        <div className='space-y-2'>
          <h4 className='text-sm font-medium'>User Agent</h4>
          <div className='text-xs bg-muted p-2 rounded break-all'>
            {diagnostics.userAgent}
          </div>
        </div>

        {/* iOS-specific Issues */}
        {diagnostics.isIOS && (
          <div className='space-y-2'>
            <h4 className='text-sm font-medium text-yellow-600'>
              Potential iOS Issues
            </h4>
            <div className='space-y-1 text-xs'>
              {diagnostics.isPrivateMode && (
                <div className='text-yellow-600'>
                  ⚠️ Private mode may limit storage
                </div>
              )}
              {!diagnostics.localStorageSupported && (
                <div className='text-red-600'>❌ LocalStorage not working</div>
              )}
              {!diagnostics.indexedDBSupported && (
                <div className='text-red-600'>❌ IndexedDB not supported</div>
              )}
              {!diagnostics.serviceWorkerSupported && (
                <div className='text-yellow-600'>
                  ⚠️ Service Worker not supported
                </div>
              )}
            </div>
          </div>
        )}

        <Button
          variant='outline'
          size='sm'
          onClick={runDiagnostics}
          disabled={isChecking}
          className='w-full'
        >
          {isChecking ? 'Running...' : 'Refresh Diagnostics'}
        </Button>
      </CardContent>
    </Card>
  );
}

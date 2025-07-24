'use client';

import { useOnlineStatus } from '@/hooks/use-online-status';
import { usePWAInstall } from '@/lib/pwa';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Wifi, WifiOff, Download, Smartphone, Check } from 'lucide-react';

export function NetworkStatus() {
  const isOnline = useOnlineStatus();
  const { isInstallable, isInstalled, install } = usePWAInstall();

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          {isOnline ? (
            <Wifi className='w-5 h-5 text-green-500' />
          ) : (
            <WifiOff className='w-5 h-5 text-red-500' />
          )}
          Network & App Status
        </CardTitle>
        <CardDescription>
          Connection status and app installation options
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Connection Status */}
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>Connection</span>
          <Badge variant={isOnline ? 'default' : 'destructive'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {/* PWA Status */}
        <div className='flex items-center justify-between'>
          <span className='text-sm font-medium'>App Installation</span>
          <div className='flex items-center gap-2'>
            {isInstalled ? (
              <Badge variant='default' className='gap-1'>
                <Check className='w-3 h-3' />
                Installed
              </Badge>
            ) : isInstallable ? (
              <Button size='sm' onClick={install} className='gap-1'>
                <Download className='w-3 h-3' />
                Install
              </Button>
            ) : (
              <Badge variant='outline'>Not Available</Badge>
            )}
          </div>
        </div>

        {/* Offline Features */}
        <div className='space-y-2'>
          <h4 className='text-sm font-medium'>Offline Features</h4>
          <div className='grid grid-cols-1 gap-1 text-xs text-muted-foreground'>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              Cached songs and setlists
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              Local data storage
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              Auto-sync when online
            </div>
            <div className='flex items-center gap-2'>
              <div className='w-2 h-2 bg-green-500 rounded-full'></div>
              Floating controls state
            </div>
          </div>
        </div>

        {/* PWA Benefits (only show if installable) */}
        {isInstallable && !isInstalled && (
          <div className='bg-muted/50 rounded-lg p-3 space-y-2'>
            <div className='flex items-center gap-2'>
              <Smartphone className='w-4 h-4 text-primary' />
              <span className='text-sm font-medium'>
                Install for Better Experience
              </span>
            </div>
            <ul className='text-xs text-muted-foreground space-y-1 ml-6'>
              <li>• Faster loading times</li>
              <li>• Home screen shortcut</li>
              <li>• Full offline support</li>
              <li>• Native app experience</li>
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

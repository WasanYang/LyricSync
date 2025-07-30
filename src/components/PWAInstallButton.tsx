'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePWAInstall } from '@/lib/pwa';
import { Download, Smartphone, Check } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface PWAInstallButtonProps {
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'sm' | 'default' | 'lg';
  className?: string;
  t: ReturnType<typeof useTranslations>;
}
export function PWAInstallButton({
  variant = 'default',
  size = 'default',
  className,
  t,
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, install } = usePWAInstall();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    if (!isInstallable) return;

    setIsInstalling(true);
    try {
      await install();
    } catch (error) {
      console.error('PWA installation failed:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  if (isInstalled) {
    return (
      <Button variant='outline' size={size} className={className} disabled>
        <Check className='w-4 h-4 mr-2' />
        {t('appInstalled')}
      </Button>
    );
  }

  if (!isInstallable) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      onClick={handleInstall}
      disabled={isInstalling}
    >
      {isInstalling ? (
        <>
          <div className='w-4 h-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent' />
          {t('installing')}
        </>
      ) : (
        <>
          <Download className='w-4 h-4 mr-2' />
          {t('installAppButton')}
        </>
      )}
    </Button>
  );
}

export function PWAPromptCard({
  t,
}: {
  t: ReturnType<typeof useTranslations>;
}) {
  const { isInstallable, isInstalled } = usePWAInstall();

  if (isInstalled || !isInstallable) {
    return null;
  }

  return (
    <div className='bg-card border border-border rounded-lg p-4 space-y-3'>
      <div className='flex items-start space-x-3'>
        <div className='p-2 bg-primary/10 rounded-lg'>
          <Smartphone className='w-5 h-5 text-primary' />
        </div>
        <div className='flex-1 space-y-1'>
          <h3 className='font-medium text-foreground'>
            {t('installAppTitle')}
          </h3>
          <p className='text-sm text-muted-foreground'>{t('installAppDesc')}</p>
        </div>
      </div>
      <PWAInstallButton size='sm' className='w-full' t={t} />
    </div>
  );
}

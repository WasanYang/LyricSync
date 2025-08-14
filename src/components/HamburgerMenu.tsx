// src/components/HamburgerMenu.tsx
'use client';

import { useTranslations, useLocale } from 'next-intl';
import {
  LogOut,
  Sun,
  Moon,
  LogIn,
  Info,
  UserCircle,
  Database,
  Users,
  Bell,
  MessageSquarePlus,
  Settings,
  ArrowLeft,
  Heart,
  Languages,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Separator } from './ui/separator';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import LocalsLink from './ui/LocalsLink';
import { GoogleIcon } from './ui/GoogleIcon';

export default function HamburgerMenu() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, logout, isSuperAdmin, signInWithGoogle } = useAuth();
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  const t = useTranslations();
  const currentLocale = useLocale();

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  useEffect(() => {
    mounted || setMounted(true);
  }, [mounted]);

  useEffect(() => {
    if (searchParams.get('panel') === 'settings') {
      setIsSettingsOpen(true);
    } else {
      setIsSettingsOpen(false);
    }
  }, [searchParams]);

  const handleSettingsOpenChange = (open: boolean) => {
    const params = new URLSearchParams(searchParams.toString());
    if (open) {
      params.set('panel', 'settings');
    } else {
      params.delete('panel');
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  const handleLanguageChange = (lang: string) => {
    if (lang !== currentLocale) {
      router.replace(pathname, { locale: lang });
    }
  };

  return (
    <Sheet open={isSettingsOpen} onOpenChange={handleSettingsOpenChange}>
      <SheetTrigger asChild>
        <Button variant='ghost' size='icon'>
          <Settings className='h-5 w-5' />
          <span className='sr-only'>Open Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side='right'
        className='w-full md:max-w-sm p-0 flex flex-col'
        showCloseButton={false}
      >
        <SheetHeader className='p-4 border-b flex flex-row items-center justify-between'>
          <Button
            variant='ghost'
            size='icon'
            onClick={() => handleSettingsOpenChange(false)}
          >
            <ArrowLeft className='h-5 w-5' />
            <span className='sr-only'>Back</span>
          </Button>
          <SheetTitle className='text-lg font-semibold font-headline'>
            {t('settingsTitle')}
          </SheetTitle>
          <div className='w-8'></div>
        </SheetHeader>
        <div
          className={cn(
            'p-4 space-y-4 overflow-y-auto flex-grow',
            'scrollbar-thin scrollbar-thumb-primary scrollbar-track-background'
          )}
        >
          {/* General Settings */}
          <div className='space-y-2'>
            <div className='flex items-center justify-between rounded-md px-3 py-2 text-base font-medium text-muted-foreground'>
              <span className='flex items-center gap-3'>
                <Languages className='h-5 w-5' />
                {t('language')}
              </span>
              <div className='flex gap-1'>
                <Button
                  size='sm'
                  variant={currentLocale === 'th' ? 'default' : 'outline'}
                  onClick={() => handleLanguageChange('th')}
                >
                  ไทย
                </Button>
                <Button
                  size='sm'
                  variant={currentLocale === 'en' ? 'default' : 'outline'}
                  onClick={() => handleLanguageChange('en')}
                >
                  EN
                </Button>
              </div>
            </div>
            <div className='flex items-center justify-between rounded-md px-3 py-2 text-base font-medium text-muted-foreground'>
              <span className='flex items-center gap-3'>
                {theme === 'light' ? (
                  <Sun className='h-5 w-5' />
                ) : (
                  <Moon className='h-5 w-5' />
                )}
                {t('theme')}
              </span>
              {mounted && (
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                  aria-label='Toggle theme'
                />
              )}
            </div>
          </div>

          <Separator />

          {/* User Specific Section */}
          {user && !user.isAnonymous && (
            <nav className='flex flex-col space-y-2'>
              <SheetClose asChild>
                <LocalsLink
                  href='/updates'
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:text-primary',
                    pathname.startsWith('/updates')
                      ? 'text-primary bg-secondary'
                      : 'text-muted-foreground'
                  )}
                >
                  <Bell className='h-5 w-5' />
                  <span>{t('updates.title')}</span>
                </LocalsLink>
              </SheetClose>
            </nav>
          )}

          {/* Admin Section */}
          {isSuperAdmin && (
            <>
              <Separator />
              <p className='px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase'>
                {t('management')}
              </p>
              <nav className='flex flex-col space-y-1'>
                <SheetClose asChild>
                  <LocalsLink
                    href='/dashboard/songs'
                    className='flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-primary'
                  >
                    <Database className='h-5 w-5' />
                    <span>{t('cloudSongs')}</span>
                  </LocalsLink>
                </SheetClose>
                <SheetClose asChild>
                  <LocalsLink
                    href='/dashboard/user-uploads'
                    className='flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-primary'
                  >
                    <Users className='h-5 w-5' />
                    <span>{t('userUploads')}</span>
                  </LocalsLink>
                </SheetClose>
                <SheetClose asChild>
                  <LocalsLink
                    href='/dashboard/notifications'
                    className='flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-primary'
                  >
                    <MessageSquarePlus className='h-5 w-5' />
                    <span>{t('notifications.title')}</span>
                  </LocalsLink>
                </SheetClose>
                <SheetClose asChild>
                  <LocalsLink
                    href='/dashboard/users'
                    className='flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-primary'
                  >
                    <Users className='h-5 w-5' />
                    <span>{t('manageUsers')}</span>
                  </LocalsLink>
                </SheetClose>
              </nav>
            </>
          )}

          <Separator />

          {/* General Links */}
          <nav className='flex flex-col space-y-1'>
            <SheetClose asChild>
              <LocalsLink
                href='/donate'
                className='flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-primary'
              >
                <Heart className='h-5 w-5' />
                <span>{t('donate.title')}</span>
              </LocalsLink>
            </SheetClose>
            <SheetClose asChild>
              <LocalsLink
                href='/welcome'
                className='flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-primary'
              >
                <Info className='h-5 w-5' />
                <span>{t('aboutApp')}</span>
              </LocalsLink>
            </SheetClose>
          </nav>
        </div>
        <div className='mt-auto p-4 border-t'>
          {user ? (
            <Button
              onClick={logout}
              variant='outline'
              className='w-full'
            >
              <LogOut className='mr-2 h-4 w-4' />
              <span>{t('logout')}</span>
            </Button>
          ) : (
            <div className='p-4 text-center bg-muted rounded-lg'>
              <h3 className='font-semibold font-headline'>
                {t('profile.unlockTitle')}
              </h3>
              <p className='text-sm text-muted-foreground mt-1 mb-4'>
                {t('profile.unlockDesc')}
              </p>
              <SheetClose asChild>
                <Button onClick={signInWithGoogle} className='w-full'>
                  <GoogleIcon className='mr-2 h-5 w-5' />
                  {t('profile.signInGoogle')}
                </Button>
              </SheetClose>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

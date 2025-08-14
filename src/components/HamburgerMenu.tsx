// src/components/HamburgerMenu.tsx
'use client';

import { useTranslations, useLocale } from 'next-intl';
import {
  LogOut,
  Sun,
  Moon,
  Info,
  Database,
  Users,
  Bell,
  MessageSquarePlus,
  Settings,
  ArrowLeft,
  Heart,
  Languages,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Switch } from '@/components/ui/switch';
import { Separator } from './ui/separator';
import { useTheme } from 'next-themes';
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useSearchParams } from 'next/navigation';
import LocalsLink from './ui/LocalsLink';
import { GoogleIcon } from './ui/GoogleIcon';
import { usePathname, useRouter } from '@/i18n/navigation';

const NavLink = ({
  href,
  icon: Icon,
  title,
  children,
}: {
  href: string;
  icon: React.ElementType;
  title: string;
  children?: React.ReactNode;
}) => (
  <LocalsLink
    href={href}
    className='flex items-center p-3 rounded-lg transition-colors hover:bg-muted/80'
  >
    <Icon className='h-5 w-5 text-muted-foreground mr-4' />
    <span className='flex-grow font-medium'>{title}</span>
    {children}
  </LocalsLink>
);

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
    router.replace({ pathname, query: Object.fromEntries(params.entries()) });
  };

  const handleLanguageChange = (lang: string) => {
    if (lang !== currentLocale) {
      router.replace(pathname, { locale: lang });
    }
  };

  const handleClose = () => {
    handleSettingsOpenChange(false);
  };

  return (
    <Sheet open={isSettingsOpen} onOpenChange={handleSettingsOpenChange}>
      <SheetTrigger asChild>
        <Button variant='ghost' size='icon' className='hidden'>
          <Settings className='h-5 w-5' />
          <span className='sr-only'>Open Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent
        side='right'
        className='w-full md:max-w-sm p-0 flex flex-col'
        showCloseButton={false}
      >
        <SheetHeader className='p-4 border-b flex flex-row items-center'>
          <Button variant='ghost' size='icon' onClick={handleClose}>
            <ArrowLeft className='h-5 w-5' />
            <span className='sr-only'>Back</span>
          </Button>
          <SheetTitle className='text-lg font-semibold font-headline mx-auto'>
            {t('settingsTitle')}
          </SheetTitle>
          <div className='w-8'></div>
        </SheetHeader>
        <div className='flex-grow overflow-y-auto p-4 space-y-8'>
          {/* General Settings */}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold text-muted-foreground px-3'>
              {t('settings.general')}
            </h3>
            <div className='flex items-center p-3 justify-between'>
              <div className='flex items-center'>
                <Languages className='h-5 w-5 text-muted-foreground mr-4' />
                <span className='font-medium'>{t('language')}</span>
              </div>
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
            <div className='flex items-center p-3 justify-between'>
              <div className='flex items-center'>
                {theme === 'light' ? (
                  <Sun className='h-5 w-5 text-muted-foreground mr-4' />
                ) : (
                  <Moon className='h-5 w-5 text-muted-foreground mr-4' />
                )}
                <span className='font-medium'>{t('theme')}</span>
              </div>
              {mounted && (
                <Switch
                  checked={theme === 'dark'}
                  onCheckedChange={toggleTheme}
                  aria-label='Toggle theme'
                />
              )}
            </div>
          </section>

          {/* Account */}
          {user && !user.isAnonymous && (
            <section className='space-y-2'>
              <h3 className='text-sm font-semibold text-muted-foreground px-3'>
                {t('settings.account')}
              </h3>
              <NavLink
                href='/updates'
                icon={Bell}
                title={t('notifications.title')}
              />
            </section>
          )}

          {/* Admin Section */}
          {isSuperAdmin && (
            <section className='space-y-2'>
              <h3 className='text-sm font-semibold text-muted-foreground px-3'>
                {t('management')}
              </h3>
              <NavLink
                href='/dashboard/songs'
                icon={Database}
                title={t('cloudSongs')}
              />
              <NavLink
                href='/dashboard/user-uploads'
                icon={Users}
                title={t('userUploads')}
              />
              <NavLink
                href='/dashboard/notifications'
                icon={MessageSquarePlus}
                title={t('notifications.title')}
              />
              <NavLink
                href='/dashboard/users'
                icon={Users}
                title={t('manageUsers')}
              />
            </section>
          )}

          {/* Support & Info Section */}
          <section className='space-y-2'>
            <h3 className='text-sm font-semibold text-muted-foreground px-3'>
              {t('settings.supportAndInfo')}
            </h3>
            <NavLink href='/donate' icon={Heart} title={t('donate.title')} />
            <NavLink href='/welcome' icon={Info} title={t('aboutApp')} />
          </section>
        </div>
        <div className='mt-auto p-4 border-t'>
          {user && !user.isAnonymous ? (
            <Button onClick={logout} variant='ghost' className='w-full'>
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
              <Button onClick={signInWithGoogle} className='w-full'>
                <GoogleIcon className='mr-2 h-5 w-5' />
                {t('profile.signInGoogle')}
              </Button>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

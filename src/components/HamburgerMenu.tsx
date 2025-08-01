'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import {
  Menu,
  LogOut,
  Home,
  Search,
  Sun,
  Moon,
  ListMusic,
  Library,
  LogIn,
  Info,
  UserCircle,
  Database,
  Users,
} from 'lucide-react';
import { Heart as HeartIcon } from 'lucide-react';
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
import { useOnlineStatus } from '@/hooks/use-online-status';
import Image from 'next/image';

// label จะถูกแปลใน component
const navLinks = [
  { href: '/', key: 'home', icon: Home },
  { href: '/search', key: 'search', icon: Search },
];

const mobileOnlyLinks = [
  { href: '/setlists', key: 'setlists', icon: ListMusic },
  { href: '/library', key: 'library', icon: Library },
];

export default function HamburgerMenu() {
  const pathname = usePathname();
  const { user, logout, isSuperAdmin } = useAuth();
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };
  const isOnline = useOnlineStatus();
  const t = useTranslations();

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div>
      <Sheet>
        <SheetTrigger asChild>
          <Button variant='ghost' size='icon'>
            <Menu />
            <span className='sr-only'>Open Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side='right' className='w-[300px] p-0'>
          <SheetHeader className='p-4 border-b'>
            <SheetTitle className='sr-only'>Main Menu</SheetTitle>
            <Link href='/' className='flex items-center space-x-2'>
              <Image
                src='/icons/logo-72.webp'
                alt='Logo'
                width={50}
                height={50}
                className='rounded-md'
              />
              <div className='flex flex-col'>
                <span className='font-bold font-headline text-lg leading-tight'>
                  LyricSync
                </span>
                <span className='text-xs text-muted-foreground leading-tight'>
                  Synchronized Worship Lyrics
                </span>
              </div>
            </Link>
          </SheetHeader>
          {/* <div className='p-4 space-y-4'> */}
          <div
            className={cn(
              'p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-4rem)] rounded-b-lg',
              'bg-background',
              'scrollbar-thin scrollbar-thumb-primary scrollbar-track-background'
            )}
          >
            <nav className='flex flex-col space-y-2'>
              {navLinks.map((link) => (
                <SheetClose asChild key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      'flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:text-primary',
                      pathname === link.href
                        ? 'text-primary'
                        : 'text-muted-foreground'
                    )}
                  >
                    <link.icon className='h-5 w-5' />
                    <span>{t(link.key)}</span>
                  </Link>
                </SheetClose>
              ))}
            </nav>
            {user && !user.isAnonymous && (
              <>
                <Separator />
                <nav className='flex flex-col space-y-2'>
                  {mobileOnlyLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          'flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:text-primary',
                          pathname.startsWith(link.href)
                            ? 'text-primary'
                            : 'text-muted-foreground'
                        )}
                      >
                        <link.icon className='h-5 w-5' />
                        <span>{t(link.key)}</span>
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
              </>
            )}

            {user ? (
              <>
                <Separator />
                <SheetClose asChild>
                  <Link
                    href='/profile'
                    className='flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-primary'
                  >
                    <UserCircle className='h-5 w-5' />
                    <span>{t('profile')}</span>
                  </Link>
                </SheetClose>
                {isSuperAdmin && (
                  <>
                    <Separator />
                    <p className='px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase'>
                      Admin
                    </p>
                    <SheetClose asChild>
                      <Link
                        href='/dashboard/songs'
                        className='flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-primary'
                      >
                        <Database className='h-5 w-5' />
                        <span>{t('cloudSongs')}</span>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href='/dashboard/user-uploads'
                        className='flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-primary'
                      >
                        <Users className='h-5 w-5' />
                        <span>{t('userUploads')}</span>
                      </Link>
                    </SheetClose>
                    <SheetClose asChild>
                      <Link
                        href='/dashboard/user-setlists'
                        className='flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-primary'
                      >
                        <ListMusic className='h-5 w-5' />
                        <span>{t('userSetlists')}</span>
                      </Link>
                    </SheetClose>
                  </>
                )}
                <Separator />
                <SheetClose asChild>
                  <button
                    onClick={logout}
                    className='flex w-full items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-primary'
                  >
                    <LogOut className='h-5 w-5' />
                    <span>{t('logout')}</span>
                  </button>
                </SheetClose>
              </>
            ) : (
              <>
                <Separator />
                <SheetClose asChild>
                  <Link
                    href='/login'
                    className='flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-primary'
                  >
                    <LogIn className='h-5 w-5' />
                    <span>{t('login')}</span>
                  </Link>
                </SheetClose>
                <SheetClose asChild>
                  <Link
                    href='/welcome'
                    className='flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-primary'
                  >
                    <Info className='h-5 w-5' />
                    <span>{t('aboutApp')}</span>
                  </Link>
                </SheetClose>
              </>
            )}

            <Separator />

            <SheetClose asChild>
              <Link
                href='/donate'
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:text-primary',
                  pathname.startsWith('/donate')
                    ? 'text-primary'
                    : 'text-muted-foreground'
                )}
              >
                <HeartIcon className='h-5 w-5' />
                <span>{t('donate.title')}</span>
              </Link>
            </SheetClose>

            <div className='flex items-center justify-between rounded-md px-3 py-2 text-base font-medium text-muted-foreground'>
              <span>{t('theme')}</span>
              {mounted && (
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={toggleTheme}
                  aria-label='Toggle theme'
                >
                  {theme === 'light' ? (
                    <Sun className='h-[1.2rem] w-[1.2rem] transition-all' />
                  ) : (
                    <Moon className='h-[1.2rem] w-[1.2rem] transition-all' />
                  )}
                </Button>
              )}
            </div>
            <div className='flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground'>
              {isOnline ? (
                <span className='relative flex h-3 w-3'>
                  <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75'></span>
                  <span className='relative inline-flex rounded-full h-3 w-3 bg-green-500'></span>
                </span>
              ) : (
                <span className='relative flex h-3 w-3'>
                  <span className='relative inline-flex rounded-full h-3 w-3 bg-gray-400'></span>
                </span>
              )}
              <span>{isOnline ? t('onlineMode') : t('offlineMode')}</span>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

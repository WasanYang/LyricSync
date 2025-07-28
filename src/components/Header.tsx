'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LogOut,
  Home,
  Search,
  ListMusic,
  Library,
  LogIn,
  User,
  UserCircle,
  Database,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { useOnlineStatus } from '@/hooks/use-online-status';
import { OfflineIndicator } from '@/components/OfflineIndicator';
import Image from 'next/image';
import { useTranslation } from '@/context/LanguageContext';
import HamburgerMenu from './HambugerMenu';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
];

const mobileOnlyLinks = [
  { href: '/setlists', label: 'Setlists', icon: ListMusic },
  { href: '/library', label: 'Library', icon: Library },
];

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox='0 0 48 48' {...props}>
      <path
        fill='#FFC107'
        d='M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z'
      ></path>
      <path
        fill='#FF3D00'
        d='M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z'
      ></path>
      <path
        fill='#4CAF50'
        d='M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z'
      ></path>
      <path
        fill='#1976D2'
        d='M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C43.021,36.251,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z'
      ></path>
    </svg>
  );
}

function UserNav() {
  const { user, logout, signInWithGoogle, isSuperAdmin } = useAuth();

  if (!user) {
    return (
      <Button asChild variant='ghost'>
        <Link href='/login'>
          <LogIn className='mr-2' /> Login
        </Link>
      </Button>
    );
  }

  const isAnonymous = user.isAnonymous;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            {!isAnonymous && (
              <AvatarImage
                src={user.photoURL || ''}
                alt={user.displayName || 'User'}
              />
            )}
            <AvatarFallback>
              {isAnonymous ? (
                <User className='h-4 w-4' />
              ) : (
                user.displayName?.[0] || 'U'
              )}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col space-y-1'>
            <p className='text-sm font-medium leading-none'>
              {isAnonymous ? 'Guest' : user.displayName}
            </p>
            {!isAnonymous && (
              <p className='text-xs leading-none text-muted-foreground'>
                {user.email}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {isAnonymous ? (
          <DropdownMenuItem onClick={() => signInWithGoogle()}>
            <GoogleIcon className='mr-2 h-4 w-4' />
            <span>Sign in with Google</span>
          </DropdownMenuItem>
        ) : (
          <DropdownMenuItem asChild>
            <Link href='/profile'>
              <UserCircle className='mr-2 h-4 w-4' />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
        )}
        {isSuperAdmin && (
          <DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Admin</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href='/dashboard/songs'>
                <Database className='mr-2 h-4 w-4' />
                <span>Manage Cloud Songs</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href='/dashboard/user-uploads'>
                <Users className='mr-2 h-4 w-4' />
                <span>User Uploads</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href='/dashboard/user-setlists'>
                <ListMusic className='mr-2 h-4 w-4' />
                <span>User Setlists</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuGroup>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className='mr-2 h-4 w-4' />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout, isSuperAdmin } = useAuth();
  const [mounted, setMounted] = useState(false);
  const isOnline = useOnlineStatus();
  const { language, setLanguage } = useTranslation();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className='sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60'>
      <div className='flex h-16 items-center justify-between px-4'>
        {/* Title */}
        <div className='flex items-center'>
          <Link href='/' className='flex items-center space-x-2'>
            <Image
              src='/logo/logo.png'
              alt='LyricSync'
              width={24}
              height={24}
            />
            <div className='flex flex-col'>
              <span className='font-bold font-headline text-lg leading-tight'>
                LyricSync
              </span>
              <span className='text-xs text-muted-foreground leading-tight hidden sm:block'>
                Synchronized Worship Lyrics
              </span>
            </div>
          </Link>
        </div>

        {/* Right side actions */}
        <div className='flex items-center justify-end space-x-2'>
          <div className='flex items-center'>
            <button
              className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                language === 'th'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-primary'
              }`}
              onClick={() => setLanguage('th')}
              aria-label='เปลี่ยนเป็นภาษาไทย'
            >
              ไทย
            </button>
            <span className='mx-1 text-muted-foreground'>|</span>
            <button
              className={`px-2 py-1 rounded text-xs font-semibold transition-colors ${
                language === 'en'
                  ? 'bg-primary text-white'
                  : 'bg-muted text-primary'
              }`}
              onClick={() => setLanguage('en')}
              aria-label='Switch to English'
            >
              EN
            </button>
          </div>
          <HamburgerMenu />
          <OfflineIndicator showBanner={true} />
        </div>
      </div>
    </header>
  );
}

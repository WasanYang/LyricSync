'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { HomeIcon, SearchIcon } from '@/components/NavIcons';
import { cn } from '@/lib/utils';
import { ListMusic } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const allNavLinks = [
  { href: '/', label: 'Home', icon: HomeIcon, isCustom: true },
  { href: '/search', label: 'Search', icon: SearchIcon, isCustom: true },
  { href: '/library', label: 'Library', icon: 'logo', isCustom: true }, // Special case for logo
  { href: '/setlists', label: 'Setlists', icon: ListMusic, isCustom: false },
];

const unauthenticatedNavLinks = [
  { href: '/', label: 'Home', icon: HomeIcon, isCustom: true },
  { href: '/search', label: 'Search', icon: SearchIcon, isCustom: true },
];

export default function BottomNavBar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Show nothing if auth state is loading
  if (user === undefined) {
    return null;
  }

  const navLinks =
    !user || user.isAnonymous ? unauthenticatedNavLinks : allNavLinks;

  return (
    <footer className='fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden'>
      <nav className='flex items-center justify-around h-[4.5rem] pb-[env(safe-area-inset-bottom)] max-w-[768px] mx-auto'>
        {navLinks.map((link) => {
          const isActive =
            pathname === link.href ||
            (link.href !== '/' && pathname.startsWith(link.href));
          const IconComponent = link.icon;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex h-full flex-col items-center justify-center gap-1 text-xs font-medium transition-colors hover:text-primary w-full',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {link.icon === 'logo' ? (
                <Image
                  src='/icons/logo-72.webp'
                  alt='Library'
                  width={72}
                  height={72}
                  className={cn('h-6 w-6', !isActive && 'opacity-60')}
                />
              ) : link.isCustom ? (
                <IconComponent className='h-6 w-6' isActive={isActive} />
              ) : (
                <ListMusic
                  className={cn(
                    'h-6 w-6',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
              )}
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}

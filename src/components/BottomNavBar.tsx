'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { HomeIcon, SearchIcon, Library } from '@/components/NavIcons';
import { cn } from '@/lib/utils';
import { ListMusic } from 'lucide-react';

const navLinks = [
  { href: '/', label: 'Home', icon: HomeIcon, isCustom: true },
  { href: '/search', label: 'Search', icon: SearchIcon, isCustom: true },
  { href: '/library', label: 'Library', icon: 'logo', isCustom: true }, // Special case for logo
  { href: '/setlists', label: 'Setlists', icon: ListMusic, isCustom: false },
];

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <footer className='fixed bottom-0 left-0 right-0 z-50 border-t bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/50 md:hidden'>
      <nav className='flex items-center justify-around h-16 max-w-[768px] mx-auto'>
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
                'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors hover:text-primary',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {link.icon === 'logo' ? (
                <Image
                  src='/logo/logo.png'
                  alt='Library'
                  width={24}
                  height={24}
                  className={cn('h-6 w-6', !isActive && 'opacity-60')}
                />
              ) : link.isCustom ? (
                <IconComponent className='h-6 w-6' isActive={isActive} />
              ) : (
                <IconComponent
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

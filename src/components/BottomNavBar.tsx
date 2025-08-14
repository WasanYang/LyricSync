'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ListMusic, Library, User, Search, Home } from 'lucide-react';
import LocalsLink from './ui/LocalsLink';

const navLinks = [
  { href: '/', label: 'Explore', icon: Home },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/my-setlists', label: 'Setlists', icon: ListMusic },
  { href: '/explore', label: 'Search', icon: Search },
];

export default function BottomNavBar() {
  const pathname = usePathname();

  // Special handling for locale root like /th or /en
  const isExactRoot = /^\/(th|en)\/?$/.test(pathname) || pathname === '/';
  const isExplore = pathname.includes('/explore');

  return (
    <footer className='fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden pb-[calc(env(safe-area-inset-bottom))]'>
      <nav className='flex items-center justify-around h-[4.5rem] max-w-[768px] mx-auto'>
        {navLinks.map((link) => {
          let isActive = false;
          if (link.href === '/') {
            isActive = isExactRoot;
          } else if (link.href === '/explore') {
            isActive = isExplore;
          } else {
            // For other links, use startsWith, but exclude the root
            isActive =
              !isExactRoot && !isExplore && pathname.startsWith(link.href);
          }

          const IconComponent = link.icon;

          return (
            <LocalsLink
              key={link.href}
              href={link.href}
              className={cn(
                'flex h-full flex-col items-center justify-center gap-1 text-xs font-medium transition-colors hover:text-primary w-full',
                isActive ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              <IconComponent
                className={cn(
                  'h-5 w-5',
                  isActive ? 'text-foreground' : 'text-muted-foreground'
                )}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span>{link.label}</span>
            </LocalsLink>
          );
        })}
      </nav>
    </footer>
  );
}

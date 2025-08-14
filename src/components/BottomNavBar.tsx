'use client';

import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { ListMusic, Library, User, Search } from 'lucide-react';
import LocalsLink from './ui/LocalsLink';

const navLinks = [
  { href: '/', label: 'Explore', icon: Search },
  { href: '/library', label: 'Library', icon: Library },
  { href: '/my-setlists', label: 'Setlists', icon: ListMusic },
  { href: '/profile', label: 'Profile', icon: User },
];

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <footer className='fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm md:hidden pb-[calc(env(safe-area-inset-bottom))]'>
      <nav className='flex items-center justify-around h-[5rem] max-w-[768px] mx-auto'>
        {navLinks.map((link) => {
          const isActive =
            (pathname === '/' && link.href === '/') ||
            (link.href !== '/' && pathname.startsWith(link.href));
          const IconComponent = link.icon;

          return (
            <LocalsLink
              key={link.href}
              href={link.href}
              className={cn(
                'flex h-full flex-col items-center justify-center gap-1 text-xs font-medium transition-colors hover:text-primary w-full',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <IconComponent
                className={cn(
                  'h-6 w-6',
                  isActive ? 'text-primary' : 'text-muted-foreground'
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

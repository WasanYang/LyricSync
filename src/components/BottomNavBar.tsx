'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { HomeIcon, SearchIcon, CreateIcon } from '@/components/NavIcons';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/search', label: 'Search', icon: SearchIcon },
  { href: '/create', label: 'Creator', icon: CreateIcon },
];

export default function BottomNavBar() {
  const pathname = usePathname();

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 md:hidden">
      <nav className="flex items-center justify-around h-16 max-w-[768px] mx-auto">
        {navLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors hover:text-primary',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <link.icon className="h-6 w-6" isActive={isActive} />
              <span>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </footer>
  );
}

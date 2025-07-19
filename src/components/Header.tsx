'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Music, Menu, LogIn, Home, Search, PlusSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
import { Separator } from './ui/separator';

const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
  { href: '/create', label: 'Create', icon: PlusSquare },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        {/* Desktop Menu */}
        <div className="hidden md:flex flex-1 items-center">
            <Link href="/" className="mr-6 flex items-center space-x-2">
              <Music className="h-6 w-6 text-primary" />
              <span className="font-bold font-headline text-lg">Rhythmic Reads</span>
            </Link>
            <nav className="flex items-center space-x-4 lg:space-x-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary',
                    pathname === link.href ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
        </div>

        {/* Mobile Title */}
         <div className="flex-1 flex justify-start md:hidden">
             <Link href="/" className="flex items-center space-x-2">
                <Music className="h-6 w-6 text-primary" />
                <span className="font-bold font-headline text-lg">Rhythmic Reads</span>
            </Link>
        </div>


        {/* Right side actions */}
        <div className="flex flex-1 items-center justify-end space-x-2">
           <div className="hidden md:block">
             <ThemeToggle />
           </div>

           {/* Mobile Menu */}
           <div className="md:hidden">
             <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu />
                    <span className="sr-only">Open Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] p-0">
                  <SheetHeader className="p-4 border-b">
                    <Link href="/" className="flex items-center space-x-2">
                      <Music className="h-6 w-6 text-primary" />
                      <span className="font-bold font-headline text-lg">Rhythmic Reads</span>
                    </Link>
                  </SheetHeader>
                  <div className="p-4 space-y-4">
                     <nav className="flex flex-col space-y-2">
                        {navLinks.map((link) => (
                          <SheetClose asChild key={link.href}>
                             <Link
                              href={link.href}
                              className={cn(
                                'flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:bg-accent',
                                pathname === link.href ? 'bg-accent text-primary' : 'text-muted-foreground'
                              )}
                            >
                              <link.icon className="h-5 w-5" />
                              <span>{link.label}</span>
                            </Link>
                          </SheetClose>
                        ))}
                      </nav>
                      <Separator />
                       <a href="#" className="flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:bg-accent">
                          <LogIn className="h-5 w-5" />
                          <span>Login</span>
                       </a>
                       <div className="flex items-center justify-between rounded-md px-3 py-2 text-base font-medium text-muted-foreground">
                           <span>Theme</span>
                           <ThemeToggle />
                        </div>
                  </div>
                </SheetContent>
              </Sheet>
           </div>
        </div>
      </div>
    </header>
  );
}

'use client';

import Link from 'next/link';
import { Music, Menu } from 'lucide-react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Button } from '@/components/ui/button';

export default function HomeHeader() {

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="flex-1 flex justify-start">
            <Button variant="ghost" size="icon">
                <Menu />
                <span className="sr-only">Open Menu</span>
            </Button>
        </div>

        <div className="flex-1 flex justify-center">
            <Link href="/" className="flex items-center space-x-2">
                <Music className="h-6 w-6 text-primary" />
                <span className="font-bold font-headline text-lg">Rhythmic Reads</span>
            </Link>
        </div>

        <div className="flex flex-1 items-center justify-end space-x-4">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}


'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Music, Menu, LogOut, Home, Search, PlusSquare, Sun, Moon, ListMusic, Library, Edit, LogIn, User, Wifi, WifiOff, Info, UserCircle, UploadCloud, Database, Users } from 'lucide-react';
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
} from "@/components/ui/dropdown-menu"
import { useOnlineStatus } from '@/hooks/use-online-status';


const navLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/search', label: 'Search', icon: Search },
];

const mobileOnlyLinks = [
    { href: '/setlists', label: 'Setlists', icon: ListMusic },
    { href: '/library', label: 'Library', icon: Library },
]

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C43.021,36.251,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
  );
}

function UserNav() {
  const { user, logout, signInWithGoogle, isSuperAdmin } = useAuth();

  if (!user) {
    return (
      <Button asChild variant="ghost">
        <Link href="/login">
          <LogIn className="mr-2"/> Login
        </Link>
      </Button>
    )
  }

  const isAnonymous = user.isAnonymous;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            { !isAnonymous && <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} /> }
            <AvatarFallback>
                {isAnonymous ? <User className="h-4 w-4" /> : (user.displayName?.[0] || 'U')}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{isAnonymous ? 'Guest' : user.displayName}</p>
            {!isAnonymous && (
                <p className="text-xs leading-none text-muted-foreground">
                {user.email}
                </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        { isAnonymous ? (
            <DropdownMenuItem onClick={() => signInWithGoogle()}>
              <GoogleIcon className="mr-2 h-4 w-4" />
              <span>Sign in with Google</span>
            </DropdownMenuItem>
        ) : (
             <DropdownMenuItem asChild>
                <Link href="/profile">
                    <UserCircle className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                </Link>
             </DropdownMenuItem>
        )}
        { isSuperAdmin && (
            <DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Admin</DropdownMenuLabel>
                <DropdownMenuItem asChild>
                    <Link href="/admin/songs">
                        <Database className="mr-2 h-4 w-4" />
                        <span>Manage Cloud Songs</span>
                    </Link>
                </DropdownMenuItem>
                 <DropdownMenuItem asChild>
                    <Link href="/admin/user-uploads">
                        <Users className="mr-2 h-4 w-4" />
                        <span>User Uploads</span>
                    </Link>
                </DropdownMenuItem>
            </DropdownMenuGroup>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={logout}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Log out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}


export default function Header() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { user, logout, isSuperAdmin } = useAuth();
  const [mounted, setMounted] = useState(false);
  const isOnline = useOnlineStatus();

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === 'dark' ? 'light' : 'dark');
  };


  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-16 items-center justify-between px-4">
        {/* Title */}
        <div className="flex items-center">
             <Link href="/" className="flex items-center space-x-2">
                <Music className="h-6 w-6 text-primary" />
                <span className="font-bold font-headline text-lg">Rhythmic Reads</span>
            </Link>
        </div>


        {/* Right side actions */}
        <div className="flex items-center justify-end space-x-2">
           {/* Mobile & Tablet Menu */}
           <div>
             <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu />
                    <span className="sr-only">Open Menu</span>
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-[300px] p-0">
                  <SheetHeader className="p-4 border-b">
                    <SheetTitle className="sr-only">Main Menu</SheetTitle>
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
                                'flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:text-primary',
                                pathname === link.href ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                              )}
                            >
                              <link.icon className="h-5 w-5" />
                              <span>{link.label}</span>
                            </Link>
                          </SheetClose>
                        ))}
                      </nav>
                      <Separator />
                       <nav className="flex flex-col space-y-2">
                        {mobileOnlyLinks.map((link) => (
                          <SheetClose asChild key={link.href}>
                             <Link
                              href={link.href}
                              className={cn(
                                'flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors hover:text-primary',
                                pathname.startsWith(link.href) ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'
                              )}
                            >
                              <link.icon className="h-5 w-5" />
                              <span>{link.label}</span>
                            </Link>
                          </SheetClose>
                        ))}
                      </nav>
                      <Separator />
                       { user ? (
                        <>
                           <SheetClose asChild>
                               <Link href="/profile" className="flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-primary">
                                  <UserCircle className="h-5 w-5" />
                                  <span>Profile</span>
                               </Link>
                           </SheetClose>
                           {isSuperAdmin && (
                            <>
                             <Separator />
                             <p className="px-3 text-xs font-semibold text-muted-foreground tracking-wider uppercase">Admin</p>
                             <SheetClose asChild>
                                <Link href="/admin/songs" className="flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-primary">
                                    <Database className="h-5 w-5" />
                                    <span>Cloud Songs</span>
                                </Link>
                             </SheetClose>
                             <SheetClose asChild>
                                <Link href="/admin/user-uploads" className="flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-primary">
                                    <Users className="h-5 w-5" />
                                    <span>User Uploads</span>
                                </Link>
                             </SheetClose>
                            </>
                           )}
                           <Separator />
                           <SheetClose asChild>
                               <button onClick={logout} className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-primary">
                                  <LogOut className="h-5 w-5" />
                                  <span>Logout</span>
                               </button>
                           </SheetClose>
                        </>
                       ) : (
                        <>
                           <SheetClose asChild>
                               <Link href="/login" className="flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-primary">
                                  <LogIn className="h-5 w-5" />
                                  <span>Login</span>
                               </Link>
                           </SheetClose>
                           <SheetClose asChild>
                               <Link href="/welcome" className="flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground transition-colors hover:text-primary">
                                  <Info className="h-5 w-5" />
                                  <span>About this App</span>
                               </Link>
                           </SheetClose>
                        </>
                       )}
                       <div className="flex items-center justify-between rounded-md px-3 py-2 text-base font-medium text-muted-foreground">
                           <span>Theme</span>
                           {mounted && (
                            <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
                              {theme === 'light' ? (
                                <Sun className="h-[1.2rem] w-[1.2rem] transition-all" />
                              ) : (
                                <Moon className="h-[1.2rem] w-[1.2rem] transition-all" />
                              )}
                            </Button>
                           )}
                        </div>
                        <div className="flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium text-muted-foreground">
                            {isOnline ? (
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                                </span>
                            ) : (
                                <span className="relative flex h-3 w-3">
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-gray-400"></span>
                                </span>
                            )}
                           <span>{isOnline ? 'Online Mode' : 'Offline Mode'}</span>
                        </div>
                  </div>
                </SheetContent>
              </Sheet>
           </div>
           <div className="hidden md:flex">
             <UserNav />
           </div>
        </div>
      </div>
    </header>
  );
}

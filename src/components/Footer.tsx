// src/components/Footer.tsx
'use client';

import Link from 'next/link';
import { Music } from 'lucide-react';
import { Separator } from './ui/separator';

const FooterLink = ({ href, children }: { href: string; children: React.ReactNode }) => (
    <li>
        <Link href={href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            {children}
        </Link>
    </li>
);

export default function Footer() {
    return (
        <footer className="w-full border-t mt-auto">
            <div className="max-w-7xl mx-auto px-8 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                    <div className="lg:col-span-2">
                        <Link href="/" className="flex items-center space-x-2 mb-4">
                            <Music className="h-6 w-6 text-primary" />
                            <span className="font-bold font-headline text-lg">Rhythmic Reads</span>
                        </Link>
                        <p className="text-sm text-muted-foreground">
                            Your personal companion for synchronized song lyrics.
                        </p>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8 lg:col-span-3">
                        <div>
                            <h3 className="font-semibold text-foreground mb-4">Company</h3>
                            <ul className="space-y-3">
                                <FooterLink href="/welcome">About</FooterLink>
                                <FooterLink href="/premium">Premium</FooterLink>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-semibold text-foreground mb-4">Legal</h3>
                             <ul className="space-y-3">
                                <FooterLink href="#">Terms of Service</FooterLink>
                                <FooterLink href="#">Privacy Policy</FooterLink>
                            </ul>
                        </div>
                    </div>
                </div>
                <Separator className="my-8" />
                <div className="text-center text-sm text-muted-foreground">
                    © {new Date().getFullYear()} Rhythmic Reads. All Rights Reserved.
                </div>
            </div>
        </footer>
    );
}

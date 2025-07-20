
// src/app/welcome/page.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Music, Share, PlusCircle, ArrowDown, MoreVertical, X } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

function FeatureCard({ icon: Icon, title, description }: { icon: React.ElementType, title: string, description: string }) {
    return (
        <div className="flex flex-col items-center text-center p-4">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary mb-4">
                <Icon className="w-6 h-6" />
            </div>
            <h3 className="font-headline font-semibold text-lg mb-1">{title}</h3>
            <p className="text-muted-foreground text-sm">{description}</p>
        </div>
    );
}

function InstallStep({ step, icon: Icon, text }: { step: number, icon: React.ElementType, text: React.ReactNode }) {
    return (
        <li className="flex items-center gap-4">
            <div className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground font-bold">{step}</div>
            <div className="flex items-center gap-3 text-sm">
                <span>{text}</span>
                <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            </div>
        </li>
    );
}

export default function WelcomePage() {
    const router = useRouter();
    const { user } = useAuth();

    const handleClose = () => {
        router.push('/');
    };
    
    return (
        <div className="bg-background min-h-screen text-foreground relative">
            <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 h-8 w-8"
            >
                <X className="w-5 h-5" />
                <span className="sr-only">Close</span>
            </Button>
            
            <main className="container mx-auto px-4 py-16 sm:py-24">
                <section className="text-center mb-16 sm:mb-24">
                    <Music className="w-16 h-16 text-primary mx-auto mb-6" />
                    <h1 className="text-4xl sm:text-5xl font-bold font-headline mb-4">Welcome to Rhythmic Reads</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Your personal companion for synchronized song lyrics. Enjoy auto-scrolling, offline access, and create your own setlists with ease.
                    </p>
                </section>

                <section className="mb-16 sm:mb-24">
                    <h2 className="text-2xl sm:text-3xl font-bold font-headline text-center mb-8 sm:mb-12">Core Features</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
                        <FeatureCard 
                            icon={Music} 
                            title="Synced Lyrics"
                            description="Lyrics that scroll automatically with pre-set timestamps, so you never lose your place."
                        />
                         <FeatureCard 
                            icon={ArrowDown}
                            title="Offline Access"
                            description="Save your favorite songs and setlists to your device for reliable access, even without an internet connection."
                        />
                         <FeatureCard 
                            icon={PlusCircle}
                            title="Setlist Creator"
                            description="Build and organize your own setlists for performances, practice, or just for fun."
                        />
                    </div>
                </section>

                <section>
                    <h2 className="text-2xl sm:text-3xl font-bold font-headline text-center mb-8 sm:mb-12">Add to Your Home Screen</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16 max-w-4xl mx-auto">
                        
                        <div className="p-6 bg-muted/50 rounded-lg">
                            <h3 className="font-headline font-semibold text-xl mb-6 text-center flex items-center justify-center gap-2">
                                <Image src="/apple-logo.svg" alt="Apple Logo" width={20} height={20} className="w-5 h-5" />
                                iOS & iPadOS
                            </h3>
                            <ol className="space-y-4">
                                <InstallStep 
                                    step={1} 
                                    icon={Share} 
                                    text={<>Tap the <strong>Share</strong> button in Safari.</>} 
                                />
                                <InstallStep 
                                    step={2} 
                                    icon={PlusCircle} 
                                    text={<>Scroll down and tap <strong>'Add to Home Screen'</strong>.</>} 
                                />
                            </ol>
                        </div>

                        <div className="p-6 bg-muted/50 rounded-lg">
                             <h3 className="font-headline font-semibold text-xl mb-6 text-center flex items-center justify-center gap-2">
                                <Image src="/android-logo.svg" alt="Android Logo" width={20} height={20} className="w-5 h-5" />
                                Android
                            </h3>
                            <ol className="space-y-4">
                                <InstallStep 
                                    step={1} 
                                    icon={MoreVertical} 
                                    text={<>Tap the <strong>Menu</strong> button (3 dots) in Chrome.</>} 
                                />
                                 <InstallStep 
                                    step={2} 
                                    icon={ArrowDown} 
                                    text={<>Tap <strong>'Install app'</strong> or <strong>'Add to Home screen'</strong>.</>} 
                                />
                            </ol>
                        </div>

                    </div>
                </section>

                 <section className="text-center mt-16 sm:mt-24">
                     <Button asChild size="lg">
                        <Link href={user ? '/' : '/login'}>Get Started</Link>
                    </Button>
                </section>
            </main>
        </div>
    );
}

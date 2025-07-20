
'use client';

import { Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function PremiumCard() {
    return (
        <Link href="/premium" className="block group">
            <div className="relative aspect-square w-full overflow-hidden rounded-md bg-gradient-to-br from-primary/80 to-accent/90 flex flex-col items-center justify-center text-center p-4 transition-all duration-300 ease-in-out hover:shadow-lg hover:shadow-primary/30 hover:scale-105">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"></div>
                <div className="relative z-10 flex flex-col items-center">
                    <div className="p-3 mb-3 rounded-full bg-background/20">
                         <Zap className="h-6 w-6 text-white" />
                    </div>
                    <p className="font-bold text-white text-sm">Go Premium</p>
                    <p className="text-white/80 text-xs mt-1">Unlock all features</p>
                </div>
                 <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:-translate-x-1">
                    <ArrowRight className="h-4 w-4 text-white/80" />
                </div>
            </div>
        </Link>
    );
}

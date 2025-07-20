
'use client';

import { Zap, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { Button } from './ui/button';

export default function PremiumCard() {
    return (
        <div className="relative w-full overflow-hidden rounded-lg bg-gradient-to-br from-primary/90 to-accent/90 p-6 shadow-lg">
             <div className="absolute inset-0 bg-black/20"></div>
             <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6">
                 <div className="flex items-center gap-4">
                    <div className="flex-shrink-0 p-3 rounded-full bg-background/20">
                         <Zap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-lg font-headline">Go Premium</h3>
                        <p className="text-white/80 text-sm mt-1">Unlock all features and elevate your performance.</p>
                    </div>
                 </div>
                 <Button asChild className="bg-white text-primary hover:bg-white/90 flex-shrink-0 w-full sm:w-auto">
                    <Link href="/premium">
                        Upgrade Now <ArrowRight className="h-4 w-4 ml-2" />
                    </Link>
                </Button>
             </div>
        </div>
    );
}

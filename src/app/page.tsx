
'use client'

import { getSongs, type Song } from '@/lib/songs';
import SongCard from '@/components/SongCard';
import Header from '@/components/Header';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel"
import BottomNavBar from '@/components/BottomNavBar';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useRef } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import PremiumCard from '@/components/PremiumCard';

// In a real app, these would come from an API
const featuredSongs = getSongs().slice(0, 4);
const recentReleases = getSongs().slice(2, 4).reverse();
const popularHits = getSongs().slice(1, 4);

interface SongSectionProps {
  title: string;
  songs: Song[];
  showPremiumCard?: boolean;
}

function SongSection({ title, songs, showPremiumCard = false }: SongSectionProps) {
  return (
    <section>
      <h2 className="text-xl font-headline font-semibold mb-4">{title}</h2>
      <div className="w-full max-w-full">
        <Carousel
          opts={{
            align: "start",
            loop: false,
          }}
          className="w-full"
        >
          <CarouselContent className="-ml-4">
            {showPremiumCard && (
              <CarouselItem className="basis-2/5 md:basis-1/5 pl-4">
                <PremiumCard />
              </CarouselItem>
            )}
            {songs.map((song) => (
              <CarouselItem key={song.id} className="basis-2/5 md:basis-1/5 pl-4">
                <Link href={`/lyrics/${song.id}`} className="block">
                  <SongCard song={song} />
                </Link>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      </div>
    </section>
  )
}

function usePullToRefresh(onRefresh: () => Promise<any>) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullState, setPullState] = useState({
      pullStart: 0,
      pullDistance: 0
  });
  const PULL_THRESHOLD = 80; // pixels

  useEffect(() => {
    const mainElement = document.getElementById('main-content');
    if (!mainElement) return;

    const handleTouchStart = (e: TouchEvent) => {
      setPullState({ ...pullState, pullStart: e.targetTouches[0].clientY });
    };

    const handleTouchMove = (e: TouchEvent) => {
        const pullDistance = e.targetTouches[0].clientY - pullState.pullStart;
        if (pullDistance > 0 && window.scrollY === 0) {
            e.preventDefault();
            setPullState({ ...pullState, pullDistance });
        }
    };

    const handleTouchEnd = () => {
        if (pullState.pullDistance > PULL_THRESHOLD) {
            setIsRefreshing(true);
            onRefresh().finally(() => {
              setIsRefreshing(false);
            });
        }
        setPullState({ pullStart: 0, pullDistance: 0 });
    };

    mainElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    mainElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    mainElement.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      mainElement.removeEventListener('touchstart', handleTouchStart);
      mainElement.removeEventListener('touchmove', handleTouchMove);
      mainElement.removeEventListener('touchend', handleTouchEnd);
    };
  }, [pullState, onRefresh]);

  return { isRefreshing, pullDistance: pullState.pullDistance, threshold: PULL_THRESHOLD };
}


export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  const handleRefresh = async () => {
    // Simulate a network request
    return new Promise(resolve => setTimeout(resolve, 1000));
  };

  const { isRefreshing, pullDistance, threshold } = usePullToRefresh(handleRefresh);

  useEffect(() => {
    // If not loading and no user, redirect to welcome page.
    if (!loading && !user) {
      router.replace('/welcome');
    }
  }, [user, loading, router]);

  // While loading or if no user (and redirecting), show a skeleton screen
  if (loading || !user) {
    return (
       <div className="flex-grow flex flex-col">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8 space-y-12 pb-24 md:pb-8">
              <div className="space-y-4">
                  <Skeleton className="h-8 w-48 mb-4" />
                  <div className="flex space-x-4">
                      <Skeleton className="h-48 w-2/5 md:w-1/5" />
                      <Skeleton className="h-48 w-2/5 md:w-1/5" />
                      <Skeleton className="h-48 w-2/5 md:w-1/5" />
                      <Skeleton className="h-48 hidden md:block md:w-1/5" />
                  </div>
              </div>
               <div className="space-y-4">
                  <Skeleton className="h-8 w-48 mb-4" />
                  <div className="flex space-x-4">
                      <Skeleton className="h-48 w-2/5 md:w-1/5" />
                      <Skeleton className="h-48 w-2/5 md:w-1/5" />
                  </div>
              </div>
          </main>
          <BottomNavBar />
      </div>
    );
  }
  
  const pullTransform = Math.min(pullDistance, threshold);
  const iconOpacity = Math.min(pullDistance / threshold, 1);

  return (
    <div className="flex-grow flex flex-col">
      <Header />
      <div 
        id="main-container" 
        className="flex-grow overflow-y-auto"
        style={{ transform: isRefreshing ? `translateY(${threshold}px)` : `translateY(${pullTransform}px)`, transition: 'transform 0.3s' }}
      >
        <div 
            className="absolute top-0 left-0 right-0 flex justify-center items-center"
            style={{ 
              transform: `translateY(-100%)`,
              paddingTop: '20px',
              paddingBottom: '20px',
            }}
        >
          <RefreshCw 
            className={cn(
              "text-muted-foreground transition-all duration-300",
              isRefreshing && "animate-spin",
              pullDistance > threshold && "text-primary"
            )}
            style={{ opacity: isRefreshing ? 1 : iconOpacity, transform: `rotate(${pullDistance * 2}deg)` }}
          />
        </div>
        <main id="main-content" className="container mx-auto px-4 py-8 space-y-12 pb-24 md:pb-8 bg-background">
          <SongSection title="Featured Songs" songs={featuredSongs} showPremiumCard={true} />
          <SongSection title="Recent Releases" songs={recentReleases} />
          <SongSection title="Popular Hits" songs={popularHits} />
        </main>
      </div>
      <BottomNavBar />
    </div>
  );
}

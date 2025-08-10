// src/components/shared/LoadingSkeleton.tsx
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';

export default function LoadingSkeleton() {
  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
        <div className='space-y-6'>
          <div className='flex justify-between items-center'>
            <Skeleton className='h-8 w-64' />
            <Skeleton className='h-10 w-32' />
          </div>
          <Skeleton className='h-10 w-full' />
          <div className='space-y-2'>
            <Skeleton className='h-14 w-full' />
            <Skeleton className='h-14 w-full' />
            <Skeleton className='h-14 w-full' />
          </div>
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

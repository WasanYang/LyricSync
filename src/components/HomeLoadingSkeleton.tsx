import BottomNavBar from './BottomNavBar';
import Header from './Header';
import { Skeleton } from './ui/skeleton';

function HomeLoadingSkeleton() {
  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 space-y-12 pb-24 md:pb-8'>
        {/* Welcome & Quick Actions Skeleton */}
        <div className='space-y-4'>
          <Skeleton className='h-8 w-48' />
          <div className='grid grid-cols-2 gap-4'>
            <Skeleton className='h-12 w-full' />
            <Skeleton className='h-12 w-full' />
          </div>
        </div>
        {/* Premium Card Skeleton */}
        <Skeleton className='h-28 w-full' />
        {/* Recent Setlists Skeleton */}
        <div className='space-y-4'>
          <Skeleton className='h-7 w-32' />
          <div className='space-y-2'>
            <Skeleton className='h-16 w-full' />
            <Skeleton className='h-16 w-full' />
          </div>
        </div>
        {/* Recommended Songs Skeleton */}
        <div className='space-y-4'>
          <Skeleton className='h-7 w-40' />
          <Skeleton className='h-10 w-full max-w-xs' />
          <div className='flex space-x-4 pt-2'>
            <Skeleton className='h-36 w-[45%] sm:w-1/4' />
            <Skeleton className='h-36 w-[45%] sm:w-1/4' />
            <Skeleton className='h-36 hidden sm:block sm:w-1/4' />
          </div>
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

export { HomeLoadingSkeleton };

'use client';

import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import ProfileCard from '@/components/ProfileCard';

export default function ProfilePage() {
  return (
    <div className='flex-grow flex flex-col'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
        <div className='max-w-2xl mx-auto'>
          <ProfileCard />
        </div>
      </main>
      <BottomNavBar />
    </div>
  );
}

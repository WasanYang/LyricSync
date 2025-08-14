import { HeaderWrapper } from '@/components/HeaderWrapper';
import { HomeClientComponent } from '@/components/page/HomeClientComponent';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';

export default function Home() {
  return (
    <>
      <main className='flex-grow container mx-auto px-4 py-8'>
        <HomeClientComponent />
      </main>
    </>
  );
}

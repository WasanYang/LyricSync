import Header from '@/components/Header';
import { HomeClientComponent } from '@/components/page/HomeClientComponent';

export default function Home() {
  return (
    <>
      <Header title={'Explore'} />
      <main className='flex-grow container mx-auto'>
        <HomeClientComponent />
      </main>
    </>
  );
}

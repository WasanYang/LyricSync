// src/app/(public)/donate/page.tsx
import Header from '@/components/Header';
import BottomNavBar from '@/components/BottomNavBar';
import Footer from '@/components/Footer';
import SEOHead from '@/components/SEOHead';
import { pageSEOConfigs } from '@/lib/seo';
import DonateCard from '@/components/DonateCard';

export default function DonatePage() {
  return (
    <>
      <SEOHead config={pageSEOConfigs.premium()} />
      <div className='flex-grow flex flex-col'>
        <Header />
        <main className='flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8'>
          <div className='max-w-2xl mx-auto text-center'>
            <div className='w-16 h-16 text-primary mx-auto mb-6 flex items-center justify-center'>
              ❤️
            </div>
            <h1 className='text-4xl sm:text-5xl font-bold font-headline mb-4'>
              สนับสนุน LyricSync
            </h1>
            <p className='text-lg text-muted-foreground max-w-2xl mx-auto mb-12'>
              ทุกการสนับสนุนของท่านเป็นกำลังใจสำคัญและช่วยให้เราสามารถพัฒนา
              LyricSync ให้ดียิ่งขึ้นต่อไปได้ ขอบคุณครับ
            </p>
          </div>
          <DonateCard />
        </main>
        <Footer />
        <BottomNavBar />
      </div>
    </>
  );
}

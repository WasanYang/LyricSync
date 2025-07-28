'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTranslation } from '@/context/LanguageContext';

export default function PrivacyPolicy() {
  const { t, language } = useTranslation();
  return (
    <div className='flex flex-col min-h-screen bg-background'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-12 max-w-2xl'>
        <h1 className='text-3xl font-bold font-headline mb-6 text-primary'>
          {language === 'th' ? 'นโยบายความเป็นส่วนตัว' : 'Privacy Policy'}
        </h1>
        <section className='space-y-6 text-base text-muted-foreground'>
          {language === 'th' ? (
            <>
              <p>
                เว็บไซต์นี้ให้ความสำคัญกับความเป็นส่วนตัวของผู้ใช้
                ข้อมูลส่วนบุคคลที่เก็บรวบรวมจะใช้เพื่อการปรับปรุงบริการและความปลอดภัยเท่านั้น
              </p>
              <h2 className='text-xl font-semibold mt-8 mb-2'>
                การเก็บรวบรวมข้อมูล
              </h2>
              <ul className='list-disc pl-6 space-y-1'>
                <li>ข้อมูลการเข้าสู่ระบบ เช่น อีเมล หรือบัญชี Google</li>
                <li>ข้อมูลการใช้งาน เช่น เพลงที่บันทึกหรือเซตลิสต์ที่สร้าง</li>
              </ul>
              <h2 className='text-xl font-semibold mt-8 mb-2'>
                การใช้งานข้อมูล
              </h2>
              <ul className='list-disc pl-6 space-y-1'>
                <li>เพื่อปรับปรุงประสบการณ์การใช้งาน</li>
                <li>เพื่อความปลอดภัยและการตรวจสอบ</li>
              </ul>
              <h2 className='text-xl font-semibold mt-8 mb-2'>
                การเปิดเผยข้อมูล
              </h2>
              <p>
                ข้อมูลส่วนบุคคลจะไม่ถูกเปิดเผยแก่บุคคลที่สาม
                ยกเว้นตามกฎหมายหรือคำสั่งศาล
              </p>
              <h2 className='text-xl font-semibold mt-8 mb-2'>การติดต่อ</h2>
              <p>
                หากมีข้อสงสัยเกี่ยวกับนโยบายนี้ กรุณาติดต่อที่ esxy26@gmail.com
              </p>
            </>
          ) : (
            <>
              <p>
                This website values your privacy. Personal data collected is
                used only to improve service and security.
              </p>
              <h2 className='text-xl font-semibold mt-8 mb-2'>
                Data Collection
              </h2>
              <ul className='list-disc pl-6 space-y-1'>
                <li>Login information such as email or Google account</li>
                <li>Usage data such as saved songs or created setlists</li>
              </ul>
              <h2 className='text-xl font-semibold mt-8 mb-2'>Data Usage</h2>
              <ul className='list-disc pl-6 space-y-1'>
                <li>To improve user experience</li>
                <li>For security and verification</li>
              </ul>
              <h2 className='text-xl font-semibold mt-8 mb-2'>Disclosure</h2>
              <p>
                Personal data will not be disclosed to third parties except as
                required by law or court order.
              </p>
              <h2 className='text-xl font-semibold mt-8 mb-2'>Contact</h2>
              <p>
                If you have questions about this policy, please contact
                esxy26@gmail.com
              </p>
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useLocale } from 'next-intl';

export default function PrivacyPolicy() {
  const language = useLocale();
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
                LyricSync ให้ความสำคัญกับความเป็นส่วนตัวของผู้ใช้
                ข้อมูลส่วนบุคคลที่เก็บรวบรวมจะใช้เพื่อการปรับปรุงบริการ
                ความปลอดภัย และฟีเจอร์ เช่น การสร้างเซ็ทลิสต์ การเล่นเพลง
                การแชร์เพลง และการใช้งานร่วมกับกลุ่มต่าง ๆ เท่านั้น
              </p>
              <h2 className='text-xl font-semibold mt-8 mb-2'>
                การเก็บรวบรวมข้อมูล
              </h2>
              <ul className='list-disc pl-6 space-y-1'>
                <li>ข้อมูลการเข้าสู่ระบบ เช่น อีเมล หรือบัญชี Google</li>
                <li>
                  ข้อมูลการใช้งาน เช่น เพลงที่บันทึก เซ็ทลิสต์ที่สร้าง
                  หรือการแชร์เพลง
                </li>
                <li>ข้อมูลการใช้งาน player และการตั้งค่าต่าง ๆ</li>
              </ul>
              <h2 className='text-xl font-semibold mt-8 mb-2'>
                การใช้งานข้อมูล
              </h2>
              <ul className='list-disc pl-6 space-y-1'>
                <li>เพื่อปรับปรุงประสบการณ์การใช้งานและฟีเจอร์ใหม่ ๆ</li>
                <li>
                  เพื่อความปลอดภัย การตรวจสอบ
                  และการป้องกันการใช้งานที่ไม่เหมาะสม
                </li>
                <li>เพื่อการซิงค์ข้อมูลข้ามอุปกรณ์และการใช้งานร่วมกับกลุ่ม</li>
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
                หรือผ่าน Facebook Page LyricSync
              </p>
            </>
          ) : (
            <>
              <p>
                LyricSync values your privacy. Personal data collected is used
                only to improve service, security, and features such as setlist
                creation, player, sharing, and group collaboration.
              </p>
              <h2 className='text-xl font-semibold mt-8 mb-2'>
                Data Collection
              </h2>
              <ul className='list-disc pl-6 space-y-1'>
                <li>Login information such as email or Google account</li>
                <li>
                  Usage data such as saved songs, created setlists, or shared
                  songs
                </li>
                <li>Player usage and user settings</li>
              </ul>
              <h2 className='text-xl font-semibold mt-8 mb-2'>Data Usage</h2>
              <ul className='list-disc pl-6 space-y-1'>
                <li>To improve user experience and add new features</li>
                <li>For security, verification, and abuse prevention</li>
                <li>For syncing data across devices and group collaboration</li>
              </ul>
              <h2 className='text-xl font-semibold mt-8 mb-2'>Disclosure</h2>
              <p>
                Personal data will not be disclosed to third parties except as
                required by law or court order.
              </p>
              <h2 className='text-xl font-semibold mt-8 mb-2'>Contact</h2>
              <p>
                If you have questions about this policy, please contact
                esxy26@gmail.com or via LyricSync Facebook Page
              </p>
            </>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}

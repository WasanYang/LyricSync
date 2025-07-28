'use client';

import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { useTranslation } from '@/context/LanguageContext';

export default function TermsOfUse() {
  const { language } = useTranslation();
  return (
    <div className='flex flex-col min-h-screen bg-background'>
      <Header />
      <main className='flex-grow container mx-auto px-4 py-12 max-w-2xl'>
        <h1 className='text-3xl font-bold font-headline mb-6 text-primary'>
          {language === 'th' ? 'ข้อกำหนดการใช้งาน' : 'Terms of Use'}
        </h1>
        <section className='space-y-6 text-base text-muted-foreground'>
          {language === 'th' ? (
            <>
              <p>
                การใช้บริการ LyricSync หมายถึงคุณยอมรับข้อกำหนดเหล่านี้
                กรุณาอ่านอย่างละเอียดก่อนใช้งาน
              </p>
              <h2 className='text-xl font-semibold mt-8 mb-2'>
                การใช้งานเนื้อหา
              </h2>
              <ul className='list-disc pl-6 space-y-1'>
                <li>
                  เนื้อเพลงและคอร์ดในระบบนี้ใช้เพื่อการนมัสการและการศึกษาส่วนบุคคลเท่านั้น
                </li>
                <li>ห้ามนำไปใช้ในเชิงพาณิชย์หรือเผยแพร่โดยไม่ได้รับอนุญาต</li>
              </ul>
              <h2 className='text-xl font-semibold mt-8 mb-2'>บัญชีผู้ใช้</h2>
              <ul className='list-disc pl-6 space-y-1'>
                <li>ผู้ใช้ต้องให้ข้อมูลที่ถูกต้องและเป็นจริง</li>
                <li>ห้ามใช้บัญชีปลอม หรือกระทำการที่ละเมิดสิทธิ์ผู้อื่น</li>
              </ul>
              <h2 className='text-xl font-semibold mt-8 mb-2'>
                การเปลี่ยนแปลงข้อกำหนด
              </h2>
              <p>
                LyricSync อาจปรับปรุงข้อกำหนดนี้ได้โดยไม่ต้องแจ้งล่วงหน้า
                กรุณาตรวจสอบเป็นระยะ
              </p>
              <h2 className='text-xl font-semibold mt-8 mb-2'>การติดต่อ</h2>
              <p>
                หากมีข้อสงสัยเกี่ยวกับข้อกำหนดนี้ กรุณาติดต่อที่
                esxy26@gmail.com
              </p>
            </>
          ) : (
            <>
              <p>
                By using LyricSync, you agree to these terms. Please read
                carefully before using the service.
              </p>
              <h2 className='text-xl font-semibold mt-8 mb-2'>Content Usage</h2>
              <ul className='list-disc pl-6 space-y-1'>
                <li>
                  Lyrics and chords in this app are for worship and personal
                  study only
                </li>
                <li>
                  Commercial use or redistribution without permission is
                  prohibited
                </li>
              </ul>
              <h2 className='text-xl font-semibold mt-8 mb-2'>User Accounts</h2>
              <ul className='list-disc pl-6 space-y-1'>
                <li>Users must provide accurate and truthful information</li>
                <li>
                  Fake accounts or actions violating others' rights are not
                  allowed
                </li>
              </ul>
              <h2 className='text-xl font-semibold mt-8 mb-2'>
                Changes to Terms
              </h2>
              <p>
                LyricSync may update these terms at any time without prior
                notice. Please check regularly.
              </p>
              <h2 className='text-xl font-semibold mt-8 mb-2'>Contact</h2>
              <p>
                If you have questions about these terms, please contact
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

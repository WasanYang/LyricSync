'use client';

import Link from 'next/link';
import { Separator } from './ui/separator';
import Image from 'next/image';

const FooterLink = ({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) => (
  <li>
    <Link
      href={href}
      className='text-sm text-muted-foreground hover:text-foreground transition-colors'
    >
      {children}
    </Link>
  </li>
);

export default function Footer() {
  return (
    <footer className='w-full border-t mt-auto'>
      <div className='max-w-7xl mx-auto px-8 py-12'>
        <div className='grid grid-cols-1 lg:grid-cols-5 gap-8'>
          <div className='lg:col-span-2'>
            <Link href='/' className='flex items-center space-x-2 mb-4'>
              <Image
                src='/icons/logo-192.png'
                alt='LyricSync'
                width={32}
                height={32}
              />
              <span className='font-bold font-headline text-lg'>LyricSync</span>
            </Link>
            <p className='text-sm text-muted-foreground'>
              LyricSync รวมเนื้อเพลง คอร์ด สร้างเซ็ทลิสต์
              และเล่นเพลงโปรดของคุณได้ทุกที่ ทุกโอกาส รองรับ auto-scroll,
              player, และแชร์เพลงสำหรับทุกคน
            </p>
          </div>

          <div className='grid grid-cols-2 md:grid-cols-3 gap-8 lg:col-span-3'>
            <div>
              <h3 className='font-semibold text-foreground mb-4'>
                ฟีเจอร์หลัก
              </h3>
              <ul className='space-y-3'>
                <FooterLink href='/welcome'>เกี่ยวกับ LyricSync</FooterLink>
                <FooterLink href='/search'>ค้นหาเพลง/เซ็ทลิสต์</FooterLink>
                <FooterLink href='/setlists'>เซ็ทลิสต์ของฉัน</FooterLink>
                <FooterLink href='/song-editor'>เพิ่ม/แก้ไขเพลง</FooterLink>
              </ul>
            </div>
            <div>
              <h3 className='font-semibold text-foreground mb-4'>
                สนับสนุนและติดต่อ
              </h3>
              <ul className='space-y-3'>
                <FooterLink href='/donate'>สนับสนุนโครงการ</FooterLink>
                <FooterLink href='https://facebook.com/lyricsync.app'>
                  Facebook Page
                </FooterLink>
              </ul>
            </div>
            <div>
              <h3 className='font-semibold text-foreground mb-4'>Legal</h3>
              <ul className='space-y-3'>
                <FooterLink href='/terms-of-use'>ข้อตกลงการใช้งาน</FooterLink>
                <FooterLink href='/privacy-policy'>
                  นโยบายความเป็นส่วนตัว
                </FooterLink>
              </ul>
            </div>
          </div>
        </div>
        <Separator className='my-8' />
        <div className='text-center text-sm text-muted-foreground'>
          © {new Date().getFullYear()} LyricSync. รวมเนื้อเพลง คอร์ด
          สร้างเซ็ทลิสต์ และเล่นเพลงสำหรับทุกโอกาส
        </div>
      </div>
    </footer>
  );
}

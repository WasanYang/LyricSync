import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ยินดีต้อนรับสู่ LyricSync | แอปค้นหาเนื้อเพลงและสร้างเซ็ตลิสต์',
  description:
    'LyricSync คือแอปพลิเคชันสำหรับคนรักเสียงเพลง ค้นหาเนื้อเพลง, สร้างและแชร์เซ็ตลิสต์ส่วนตัว, และติดตั้งลงบนเครื่องเพื่อใช้งานแบบออฟไลน์ (PWA) เริ่มต้นใช้งานเลย!',
  openGraph: {
    title: 'LyricSync | แอปค้นหาเนื้อเพลงและสร้างเซ็ตลิสต์',
    description:
      'ค้นหาเนื้อเพลง, สร้างเซ็ตลิสต์, และติดตั้งลงบนเครื่องเพื่อใช้งานแบบออฟไลน์',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

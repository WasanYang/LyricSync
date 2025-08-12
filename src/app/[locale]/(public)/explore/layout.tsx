import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'สำรวจเซ็ตลิสต์',
  description:
    'ค้นพบเซ็ตลิสต์เพลงที่สร้างโดยผู้ใช้คนอื่นๆ ในชุมชนของเรา ติดตามผู้คนที่คุณชื่นชอบและดูว่าพวกเขากำลังฟังเพลงอะไรอยู่',
  openGraph: {
    title: 'สำรวจเซ็ตลิสต์',
    description: 'ค้นพบเซ็ตลิสต์เพลงที่สร้างโดยผู้ใช้คนอื่นๆ ในชุมชนของเรา',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ค้นหาเพลง | Search for Songs',
  description:
    'ค้นหาเพลงโปรดของคุณจากฐานข้อมูลนับล้านเพลง พิมพ์ชื่อเพลง, ชื่อศิลปิน, หรือส่วนหนึ่งของเนื้อเพลงที่คุณจำได้เพื่อค้นหาเนื้อเพลงและข้อมูลเพลงทันที',
  openGraph: {
    title: 'ค้นหาเพลง | Search for Songs',
    description: 'ค้นหาเพลงจากชื่อ, ศิลปิน, หรือเนื้อร้องที่คุณจำได้',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

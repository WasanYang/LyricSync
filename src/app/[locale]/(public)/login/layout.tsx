import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'เข้าสู่ระบบ | Login',
  description:
    'เข้าสู่ระบบเพื่อเข้าถึงฟีเจอร์ทั้งหมด จัดการเพลงและเซ็ตลิสต์ของคุณ',
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

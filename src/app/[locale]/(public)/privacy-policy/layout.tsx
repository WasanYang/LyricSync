import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'นโยบายความเป็นส่วนตัว | Privacy Policy',
  description:
    'อ่านนโยบายความเป็นส่วนตัวของเราเพื่อทำความเข้าใจว่าเราเก็บรวบรวม, ใช้งาน, และปกป้องข้อมูลส่วนบุคคลของคุณอย่างไร',
  openGraph: {
    title: 'นโยบายความเป็นส่วนตัว | Privacy Policy',
    description: 'ทำความเข้าใจวิธีที่เราจัดการและปกป้องข้อมูลส่วนบุคคลของคุณ',
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

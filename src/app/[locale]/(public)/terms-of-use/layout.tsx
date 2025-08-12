import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'ข้อกำหนดในการให้บริการ | Terms of Use',
  description:
    'อ่านข้อกำหนดและเงื่อนไขในการใช้งานเว็บไซต์และบริการของเรา เพื่อทำความเข้าใจสิทธิ์และข้อผูกพันของคุณในการใช้งาน',
  openGraph: {
    title: 'ข้อกำหนดในการให้บริการ | Terms of Use',
    description:
      'ทำความเข้าใจสิทธิ์และข้อผูกพันของคุณในการใช้งานเว็บไซต์ของเรา',
  },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'สนับสนุนเรา',
  description:
    'ร่วมสนับสนุนการพัฒนาเว็บไซต์และชุมชนคนรักเสียงเพลง เพื่อให้เราสามารถสร้างสรรค์ฟีเจอร์ใหม่ๆ และดูแลรักษาระบบให้ดียิ่งขึ้นต่อไป',
  openGraph: {
    title: 'สนับสนุนเรา',
    description: 'ร่วมสนับสนุนการพัฒนาเว็บไซต์และชุมชนคนรักเสียงเพลง',
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

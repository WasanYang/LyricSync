import Link from 'next/link';
import { Button } from './ui/button';

export default function WelcomeCard() {
  return (
    <section className='text-center space-y-6'>
      <div className='space-y-3'>
        <h1 className='text-3xl font-bold font-headline'>
          Welcome to LyricSync
        </h1>
        <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
          เครื่องมือสำหรับทีมนมัสการ ด้วยเนื้อเพลง คอร์ด และระบบเล่นอัตโนมัติ
          สำหรับคริสตจักรและกลุ่มนมัสการ
        </p>
      </div>
      <div className='flex flex-col sm:flex-row gap-4 justify-center'>
        <Button size='lg' asChild>
          <Link href='/login'>Get Started</Link>
        </Button>
        <Button variant='outline' size='lg' asChild>
          <Link href='/welcome'>Learn More</Link>
        </Button>
      </div>
    </section>
  );
}

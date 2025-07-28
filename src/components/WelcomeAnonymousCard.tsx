import Link from 'next/link';
import { Button } from './ui/button';

export default function WelcomeAnonymousCard() {
  return (
    <section className='text-center space-y-6'>
      <div className='space-y-3'>
        <h1 className='text-3xl font-bold font-headline'>
          Welcome to LyricSync
        </h1>
        <p className='text-lg text-muted-foreground max-w-2xl mx-auto'>
          คุณกำลังใช้งานในโหมด Guest
          <br />
          <span className='text-primary font-semibold'>
            ลงชื่อเข้าใช้เพื่อบันทึกเซตลิสต์และปลดล็อกฟีเจอร์ทั้งหมด!
          </span>
        </p>
      </div>
      <div className='flex flex-col sm:flex-row gap-4 justify-center'>
        <Button size='lg' asChild>
          <Link href='/login'>
            <span role='img' aria-label='unlock'>
              🔓
            </span>
            Unlock All Features
          </Link>
        </Button>
        <Button variant='outline' size='lg' asChild>
          <Link href='/welcome'>Learn More</Link>
        </Button>
      </div>
      <p className='text-sm text-muted-foreground'>
        การลงชื่อเข้าใช้จะช่วยให้คุณบันทึกเพลงและเซตลิสต์ของคุณเองได้
      </p>
    </section>
  );
}

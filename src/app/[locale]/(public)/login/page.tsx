// src/app/login/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
// import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Music, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import SEOHead from '@/components/SEOHead';
import { pageSEOConfigs } from '@/lib/seo';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useLocale } from 'next-intl';
import { GoogleIcon } from '@/components/ui/GoogleIcon';

export default function LoginPage() {
  const { signInWithGoogle, signInAnonymously } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const pathname = usePathname();
  const language = useLocale();
  const setLanguage = (lang: string) => {
    // เปลี่ยน path locale
    router.replace(pathname, { locale: lang });
  };

  const handleSignIn = async (method: 'google' | 'guest') => {
    try {
      if (method === 'google') {
        await signInWithGoogle();
      } else {
        await signInAnonymously();
      }
      router.push('/');
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: 'Login Error',
          description: error.message,
          variant: 'destructive',
        });
      }
    }
  };

  const handleClose = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push('/');
    }
  };

  return (
    <>
      <SEOHead config={pageSEOConfigs.login()} />
      <div className='flex-grow flex flex-col items-center justify-center p-4 relative'>
        {/* Language Switcher */}
        <div className='absolute top-4 left-4 z-20 flex gap-2'>
          <button
            onClick={() => setLanguage('th')}
            className={`px-3 py-1 rounded font-medium border transition-colors duration-150 text-sm ${
              language === 'th'
                ? 'bg-primary text-white border-primary'
                : 'bg-card text-foreground border-border hover:bg-primary/10'
            }`}
            aria-label='เปลี่ยนเป็นภาษาไทย'
          >
            ไทย
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={`px-3 py-1 rounded font-medium border transition-colors duration-150 text-sm ${
              language === 'en'
                ? 'bg-primary text-white border-primary'
                : 'bg-card text-foreground border-border hover:bg-primary/10'
            }`}
            aria-label='Switch to English'
          >
            EN
          </button>
        </div>
        <Button
          variant='ghost'
          size='icon'
          onClick={handleClose}
          className='absolute top-4 right-4 z-10 h-8 w-8'
        >
          <X className='w-5 h-5' />
          <span className='sr-only'>Close</span>
        </Button>
        <div className='w-full max-w-sm flex flex-col items-center text-center'>
          <Music className='h-12 w-12 text-primary mb-4' />
          <h1 className='text-2xl font-bold font-headline mb-2'>
            Welcome to LyricSync
          </h1>
          <p className='text-muted-foreground mb-4'>
            เข้าสู่ระบบเพื่อบันทึกเซตลิสต์และเพลงของคุณ หรือทดลองใช้งานแบบ Guest
            ได้ทันที!
          </p>
          <div className='w-full space-y-4'>
            <Button
              onClick={() => handleSignIn('google')}
              size='lg'
              className='w-full'
            >
              <GoogleIcon className='mr-2 h-5 w-5' />
              Sign In with Google
            </Button>
            <Button
              onClick={() => handleSignIn('guest')}
              size='lg'
              variant='secondary'
              className='w-full'
            >
              <Music className='mr-2 h-5 w-5' />
              ทดลองใช้งานแบบ Guest
            </Button>
          </div>
          <div className='mt-8 text-sm text-muted-foreground'>
            <div className='mb-2 font-semibold text-primary'>
              โหมด Guest คืออะไร?
            </div>
            <ul className='list-disc list-inside text-left mx-auto max-w-xs'>
              <li>ใช้งานฟีเจอร์พื้นฐานได้ทันที</li>
              <li>ไม่ต้องสมัครสมาชิก</li>
              <li>ข้อมูลจะไม่ถูกบันทึกหรือ sync ข้ามอุปกรณ์</li>
              <li>สามารถสมัครสมาชิกภายหลังได้ทุกเมื่อ</li>
            </ul>
          </div>
        </div>
      </div>
    </>
  );
}

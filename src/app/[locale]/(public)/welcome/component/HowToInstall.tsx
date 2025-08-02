import Image from 'next/image';
import { Share, PlusCircle, ArrowDown, MoreVertical } from 'lucide-react';

function InstallStep({
  step,
  icon: Icon,
  text,
}: {
  step: number;
  icon: React.ElementType;
  text: React.ReactNode;
}) {
  return (
    <li className='flex items-center gap-4'>
      <div className='flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-muted text-muted-foreground font-bold'>
        {step}
      </div>
      <div className='flex items-center gap-3 text-sm'>
        <span>{text}</span>
        <Icon className='w-5 h-5 text-muted-foreground flex-shrink-0' />
      </div>
    </li>
  );
}

const HowToInstallTH = () => {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16 max-w-4xl mx-auto'>
      <div className='p-6 bg-muted/50 rounded-lg'>
        <h3 className='font-headline font-semibold text-xl mb-6 text-center flex items-center justify-center gap-2'>
          <Image
            src='/apple-logo.svg'
            alt='Apple Logo'
            width={20}
            height={20}
            className='w-5 h-5'
          />
          iOS & iPadOS
        </h3>
        <ol className='space-y-4'>
          <InstallStep
            step={1}
            icon={Share}
            text={
              <>
                แตะ <strong>Share</strong> ใน Safari
              </>
            }
          />
          <InstallStep
            step={2}
            icon={PlusCircle}
            text={
              <>
                เลื่อนลงแล้วเลือก <strong>เพิ่มไปยังหน้าจอหลัก</strong>
              </>
            }
          />
        </ol>
      </div>

      <div className='p-6 bg-muted/50 rounded-lg'>
        <h3 className='font-headline font-semibold text-xl mb-6 text-center flex items-center justify-center gap-2'>
          <Image
            src='/android-logo.svg'
            alt='Android Logo'
            width={20}
            height={20}
            className='w-5 h-5'
          />
          Android
        </h3>
        <ol className='space-y-4'>
          <InstallStep
            step={1}
            icon={MoreVertical}
            text={
              <>
                แตะ <strong>เมนู</strong> (จุด 3 จุด) ใน Chrome
              </>
            }
          />
          <InstallStep
            step={2}
            icon={ArrowDown}
            text={
              <>
                เลือก <strong>ติดตั้งแอป</strong> หรือ
                <strong>เพิ่มไปยังหน้าจอหลัก</strong>
              </>
            }
          />
        </ol>
      </div>
    </div>
  );
};

const HowToInstallEN = () => {
  return (
    <div className='grid grid-cols-1 md:grid-cols-2 gap-12 sm:gap-16 max-w-4xl mx-auto'>
      <div className='p-6 bg-muted/50 rounded-lg'>
        <h3 className='font-headline font-semibold text-xl mb-6 text-center flex items-center justify-center gap-2'>
          <Image
            src='/apple-logo.svg'
            alt='Apple Logo'
            width={20}
            height={20}
            className='w-5 h-5'
          />
          iOS & iPadOS
        </h3>
        <ol className='space-y-4'>
          <InstallStep
            step={1}
            icon={Share}
            text={
              <>
                Tap <strong>Share</strong> in Safari
              </>
            }
          />
          <InstallStep
            step={2}
            icon={PlusCircle}
            text={
              <>
                Scroll down and tap <strong>Add to Home Screen</strong>
              </>
            }
          />
        </ol>
      </div>

      <div className='p-6 bg-muted/50 rounded-lg'>
        <h3 className='font-headline font-semibold text-xl mb-6 text-center flex items-center justify-center gap-2'>
          <Image
            src='/android-logo.svg'
            alt='Android Logo'
            width={20}
            height={20}
            className='w-5 h-5'
          />
          Android
        </h3>
        <ol className='space-y-4'>
          <InstallStep
            step={1}
            icon={MoreVertical}
            text={
              <>
                Tap <strong>Menu</strong> (three dots) in Chrome
              </>
            }
          />
          <InstallStep
            step={2}
            icon={ArrowDown}
            text={
              <>
                Tap <strong>Install app</strong> or{' '}
                <strong>Add to Home Screen</strong>
              </>
            }
          />
        </ol>
      </div>
    </div>
  );
};

export { HowToInstallTH, HowToInstallEN };

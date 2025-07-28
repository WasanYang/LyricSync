// src/components/DonateCard.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DonateCard() {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const bankAccountNumber = '123-4-56789-0';

  const handleCopy = () => {
    navigator.clipboard.writeText(bankAccountNumber).then(() => {
      setCopied(true);
      toast({
        title: 'คัดลอกเลขบัญชีแล้ว',
        description: `เลขบัญชี ${bankAccountNumber} ถูกคัดลอกไปยังคลิปบอร์ด`,
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className='max-w-md mx-auto'>
      <CardHeader>
        <CardTitle className='text-center font-headline'>
          ช่องทางการสนับสนุน
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='text-center space-y-4'>
          <h3 className='font-semibold'>พร้อมเพย์ (PromptPay)</h3>
          <div className='flex justify-center'>
            <Image
              src='https://placehold.co/250x250.png?text=PromptPay%5CnQR+Code'
              alt='PromptPay QR Code'
              width={250}
              height={250}
              className='rounded-lg border'
              data-ai-hint='qr code'
            />
          </div>
        </div>
        <div className='text-center space-y-4'>
          <h3 className='font-semibold'>โอนผ่านบัญชีธนาคาร</h3>
          <div className='p-4 bg-muted rounded-lg text-left space-y-2'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>ธนาคาร:</span>
              <span className='font-mono'>ธนาคารกสิกรไทย</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>ชื่อบัญชี:</span>
              <span className='font-mono'>นาย วศิน ยังประภากร</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>เลขบัญชี:</span>
              <span className='font-mono text-lg font-bold text-primary'>
                {bankAccountNumber}
              </span>
            </div>
          </div>
          <Button onClick={handleCopy} className='w-full'>
            {copied ? (
              <Check className='mr-2 h-4 w-4' />
            ) : (
              <Copy className='mr-2 h-4 w-4' />
            )}
            {copied ? 'คัดลอกแล้ว' : 'คัดลอกเลขบัญชี'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

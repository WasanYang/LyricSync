'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Image from 'next/image';
import { Copy, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import qrPromtpay from '../../public/promptpay-qr.jpg'; // Adjust the path as needed
interface DonateCardProps {
  t: ReturnType<typeof import('next-intl').useTranslations>;
}

export default function DonateCard({ t }: DonateCardProps) {
  const { toast } = useToast();
  const [copied, setCopied] = useState(false);
  const bankAccountNumber = '042-1-63299-5';

  const handleCopy = () => {
    navigator.clipboard.writeText(bankAccountNumber).then(() => {
      setCopied(true);
      toast({
        title: t('copiedTitle'),
        description: t('copiedDesc', { bankAccountNumber }),
      });
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Card className='max-w-md mx-auto'>
      <CardHeader>
        <CardTitle className='text-center font-headline'>
          {t('methodsTitle')}
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div className='text-center space-y-4'>
          <h3 className='font-semibold'>{t('promptpayTitle')}</h3>
          <div className='flex justify-center'>
            <Image
              src={qrPromtpay}
              alt={t('promptpayAlt')}
              width={250}
              height={250}
              className='rounded-lg border'
              data-ai-hint='qr code'
            />
          </div>
        </div>
        <div className='text-center space-y-4'>
          <h3 className='font-semibold'>{t('bankTitle')}</h3>
          <div className='p-4 bg-muted rounded-lg text-left space-y-2'>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>
                {t('bankLabel')}:
              </span>
              <span className='font-mono'>{t('bankName')}</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>
                {t('accountNameLabel')}:
              </span>
              <span className='font-mono'>{t('accountName')}</span>
            </div>
            <div className='flex justify-between items-center'>
              <span className='text-sm text-muted-foreground'>
                {t('accountNumberLabel')}:
              </span>
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
            {copied ? t('copiedButton') : t('copyButton')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

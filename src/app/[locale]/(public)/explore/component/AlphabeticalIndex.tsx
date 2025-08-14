// src/app/[locale]/(public)/explore/component/AlphabeticalIndex.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { ChevronsUpDown, CaseSensitive } from 'lucide-react';
import { useTranslations } from 'next-intl';

const THAI_ALPHABET = [
  'ก',
  'ข',
  'ค',
  'ฆ',
  'ง',
  'จ',
  'ฉ',
  'ช',
  'ซ',
  'ฌ',
  'ญ',
  'ฎ',
  'ฏ',
  'ฐ',
  'ฑ',
  'ฒ',
  'ณ',
  'ด',
  'ต',
  'ถ',
  'ท',
  'ธ',
  'น',
  'บ',
  'ป',
  'ผ',
  'ฝ',
  'พ',
  'ฟ',
  'ภ',
  'ม',
  'ย',
  'ร',
  'ล',
  'ว',
  'ศ',
  'ษ',
  'ส',
  'ห',
  'ฬ',
  'อ',
  'ฮ',
];
const ENG_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

interface AlphabeticalIndexProps {
  selectedChar: string | null;
  onCharSelect: (char: string) => void;
}

export default function AlphabeticalIndex({
  selectedChar,
  onCharSelect,
}: AlphabeticalIndexProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('search');

  const renderButtons = (alphabet: string[]) => {
    return alphabet.map((char) => (
      <Button
        key={char}
        variant={selectedChar === char ? 'default' : 'outline'}
        size='sm'
        className='h-7 w-7 p-0 text-xs md:h-8 md:w-8'
        onClick={() => onCharSelect(char)}
      >
        {char}
      </Button>
    ));
  };

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className='w-full space-y-2'
    >
      <CollapsibleTrigger asChild>
        <Button variant='outline' className='w-full justify-between'>
          <div className='flex items-center gap-2'>
            <CaseSensitive className='h-4 w-4' />
            <span>{t('browseByLetter')}</span>
          </div>
          <ChevronsUpDown className='h-4 w-4' />
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className='space-y-2 rounded-lg bg-muted/50 p-3'>
          <div className='flex flex-wrap gap-1 justify-center'>
            {renderButtons(THAI_ALPHABET)}
          </div>
          <div className='flex flex-wrap gap-1 justify-center'>
            {renderButtons(ENG_ALPHABET)}
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

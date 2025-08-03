// src/app/[locale]/(public)/search/component/AlphabeticalIndex.tsx
'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

const THAI_ALPHABET = [
  'ก', 'ข', 'ค', 'ฆ', 'ง', 'จ', 'ฉ', 'ช', 'ซ', 'ฌ', 'ญ', 'ฎ', 'ฏ', 'ฐ', 'ฑ', 'ฒ', 'ณ', 'ด', 'ต', 'ถ', 'ท', 'ธ', 'น', 'บ', 'ป', 'ผ', 'ฝ', 'พ', 'ฟ', 'ภ', 'ม', 'ย', 'ร', 'ล', 'ว', 'ศ', 'ษ', 'ส', 'ห', 'ฬ', 'อ', 'ฮ'
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
  const pathname = usePathname();

  const renderButtons = (alphabet: string[]) => {
    return alphabet.map((char) => (
      <Button
        key={char}
        variant={selectedChar === char ? 'default' : 'outline'}
        size='sm'
        className='h-8 w-8 p-0 text-xs md:h-9 md:w-9 md:text-sm'
        onClick={() => onCharSelect(char)}
      >
        {char}
      </Button>
    ));
  };

  return (
    <div className='space-y-3'>
      <div className='flex flex-wrap gap-1.5 justify-center'>
        {renderButtons(THAI_ALPHABET)}
      </div>
      <div className='flex flex-wrap gap-1.5 justify-center'>
        {renderButtons(ENG_ALPHABET)}
      </div>
    </div>
  );
}

// src/components/SearchInput.tsx
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function SearchInput({
  value,
  onChange,
  placeholder = 'Search...',
}: SearchInputProps) {
  return (
    <div className='relative'>
      <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground focus:outline-none active:outline-none' />
      <Input
        placeholder={placeholder}
        className='pl-10 bg-muted focus:outline-none active:outline-none'
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

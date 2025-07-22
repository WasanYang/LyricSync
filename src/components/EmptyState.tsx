// src/components/EmptyState.tsx
import { FC, SVGProps } from 'react';

interface EmptyStateProps {
  icon: FC<SVGProps<SVGSVGElement>>;
  title: string;
  description: string;
  searchTerm?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  searchTerm,
}: EmptyStateProps) {
  return (
    <div className='text-center py-16 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full'>
      <Icon className='h-12 w-12 text-muted-foreground mb-4' />
      <h2 className='text-xl font-headline font-semibold'>{title}</h2>
      <p className='text-muted-foreground'>
        {searchTerm ? `${description} "${searchTerm}".` : description}
      </p>
    </div>
  );
}

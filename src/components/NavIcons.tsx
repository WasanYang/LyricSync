// src/components/NavIcons.tsx
'use client';

interface NavIconProps {
  className?: string;
  isActive: boolean;
}

export function HomeIcon({ className, isActive }: NavIconProps) {
  if (isActive) {
    return (
      <svg
        className={className}
        viewBox='0 0 24 24'
        fill='currentColor'
        stroke='none'
      >
        <rect x='3' y='3' width='8' height='8' rx='1'></rect>
        <rect x='13' y='3' width='8' height='8' rx='1'></rect>
        <rect x='3' y='13' width='8' height='8' rx='1'></rect>
        <rect x='13' y='13' width='8' height='8' rx='1'></rect>
      </svg>
    );
  }
  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <rect x='3' y='3' width='8' height='8' rx='1'></rect>
      <rect x='13' y='3' width='8' height='8' rx='1'></rect>
      <rect x='3' y='13' width='8' height='8' rx='1'></rect>
      <rect x='13' y='13' width='8' height='8' rx='1'></rect>
    </svg>
  );
}

export function SearchIcon({ className, isActive }: NavIconProps) {
  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <circle cx='11' cy='11' r='8'></circle>
      <line x1='21' y1='21' x2='16.65' y2='16.65'></line>
      {isActive && <circle cx='11' cy='11' r='3' fill='currentColor'></circle>}
    </svg>
  );
}

export function Library({ className, isActive }: NavIconProps) {
  return (
    <svg
      className={className}
      viewBox='0 0 24 24'
      fill='none'
      stroke='currentColor'
      strokeWidth='2'
      strokeLinecap='round'
      strokeLinejoin='round'
    >
      <path d='M16 6l4 14' />
      <path d='M12 6v14' />
      <path d='M8 8v12' />
      <path d='M4 4v16' />
      {isActive && (
        <g>
          <path d='M16 6l4 14' stroke='none' fill='currentColor' />
          <path d='M12 6v14' stroke='none' fill='currentColor' />
          <path d='M8 8v12' stroke='none' fill='currentColor' />
          <path d='M4 4v16' stroke='none' fill='currentColor' />
        </g>
      )}
    </svg>
  );
}

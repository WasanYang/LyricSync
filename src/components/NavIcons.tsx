// src/components/NavIcons.tsx
'use client';

interface NavIconProps {
  className?: string;
  isActive: boolean;
}

export function HomeIcon({ className, isActive }: NavIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill={isActive ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
      {isActive && <polyline points="9 22 9 12 15 12 15 22"></polyline>}
    </svg>
  );
}

export function SearchIcon({ className, isActive }: NavIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      {isActive && <circle cx="11" cy="11" r="3" fill="currentColor"></circle>}
    </svg>
  );
}

export function CreateIcon({ className, isActive }: NavIconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill={isActive ? 'currentColor' : 'none'}></rect>
      {!isActive && <line x1="12" y1="8" x2="12" y2="16"></line>}
      {!isActive && <line x1="8" y1="12" x2="16" y2="12"></line>}
      {isActive && <line x1="12" y1="8" x2="12" y2="16" stroke="hsl(var(--background))"></line>}
      {isActive && <line x1="8" y1="12" x2="16" y2="12" stroke="hsl(var(--background))"></line>}
    </svg>
  );
}

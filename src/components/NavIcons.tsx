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
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="none"
      >
        <rect x="3" y="3" width="8" height="8" rx="1"></rect>
        <rect x="13" y="3" width="8" height="8" rx="1"></rect>
        <rect x="3" y="13" width="8" height="8" rx="1"></rect>
        <rect x="13" y="13" width="8" height="8" rx="1"></rect>
      </svg>
    )
  }
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
      <rect x="3" y="3" width="8" height="8" rx="1"></rect>
      <rect x="13" y="3" width="8" height="8" rx="1"></rect>
      <rect x="3" y="13" width="8" height="8" rx="1"></rect>
      <rect x="13" y="13" width="8" height="8" rx="1"></rect>
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
      {isActive ? (
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" fill={'currentColor'}></rect>
          <line x1="12" y1="8" x2="12" y2="16" stroke="hsl(var(--background))"></line>
          <line x1="8" y1="12" x2="16" y2="12" stroke="hsl(var(--background))"></line>
        </>
      ) : (
        <>
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </>
      )}
    </svg>
  );
}

// src/components/FloatingSectionNavigator.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Move, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Section {
  name: string;
  startTime: number;
  index: number;
  uniqueKey: string;
}

interface FloatingSectionNavigatorProps {
  sections: Section[];
  currentSection: Section | null | undefined;
  onSectionJump: (sectionIndex: number) => void;
  onClose: () => void;
  isVisible?: boolean;
  onToggleVisibility?: () => void;
}

export default function FloatingSectionNavigator({
  sections,
  currentSection,
  onSectionJump,
  onClose,
  isVisible = true,
  onToggleVisibility,
}: FloatingSectionNavigatorProps) {
  const navigatorRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Load position from localStorage on mount
  useEffect(() => {
    const savedPosition = localStorage.getItem(
      'floatingSectionNavigator-position'
    );
    if (savedPosition) {
      try {
        const parsedPosition = JSON.parse(savedPosition);
        setPosition(parsedPosition);
      } catch (error) {
        console.warn('Failed to parse saved position:', error);
      }
    } else {
      // Set initial position if nothing is saved
      // Center horizontally and place below the header
      if (navigatorRef.current) {
        const navigatorWidth = navigatorRef.current.offsetWidth;
        const initialX = window.innerWidth / 2 - navigatorWidth / 2;
        setPosition({
          x: window.innerWidth - initialX - navigatorWidth, // Position is based on 'right'
          y: 80, // Approx height of top navbars
        });
      } else {
        // Fallback if ref is not ready
        setPosition({
          x: window.innerWidth / 2 - 50,
          y: 80,
        });
      }
    }
  }, []);

  // Save position to localStorage when position changes
  useEffect(() => {
    if (position) {
      localStorage.setItem(
        'floatingSectionNavigator-position',
        JSON.stringify(position)
      );
    }
  }, [position]);

  const handleDragMouseDown = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (navigatorRef.current) {
        setIsDragging(true);
        const rect = navigatorRef.current.getBoundingClientRect();
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        });
      }
    },
    []
  );

  const handleDragTouchStart = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      if (navigatorRef.current) {
        setIsDragging(true);
        const touch = e.touches[0];
        const rect = navigatorRef.current.getBoundingClientRect();
        setDragOffset({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        });
      }
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && navigatorRef.current) {
        const rect = navigatorRef.current.getBoundingClientRect();

        // Calculate new position based on left positioning
        let newX = e.clientX - dragOffset.x;
        let newY = e.clientY - dragOffset.y;

        // Constrain to viewport bounds (with navbar consideration)
        const navbarHeight = 64; // Assume navbar height is 64px
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(navbarHeight, Math.min(newY, maxY));

        // Convert left position to right position for styling
        const newRight = window.innerWidth - newX - rect.width;

        setPosition({
          x: newRight,
          y: newY,
        });
      }
    },
    [isDragging, dragOffset]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isDragging && navigatorRef.current) {
        const touch = e.touches[0];
        const rect = navigatorRef.current.getBoundingClientRect();

        let newX = touch.clientX - dragOffset.x;
        let newY = touch.clientY - dragOffset.y;

        const navbarHeight = 64; // Assume navbar height is 64px
        const maxX = window.innerWidth - rect.width;
        const maxY = window.innerHeight - rect.height;

        newX = Math.max(0, Math.min(newX, maxX));
        newY = Math.max(navbarHeight, Math.min(newY, maxY));

        const newRight = window.innerWidth - newX - rect.width;

        setPosition({
          x: newRight,
          y: newY,
        });
      }
    },
    [isDragging, dragOffset]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleTouchEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleTouchEnd);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [
    isDragging,
    handleMouseMove,
    handleMouseUp,
    handleTouchMove,
    handleTouchEnd,
  ]);

  const handleClose = () => {
    if (onToggleVisibility) {
      onToggleVisibility();
    } else {
      onClose();
    }
  };

  if (!sections || sections.length === 0 || !isVisible || !position) {
    return null;
  }

  return (
    <div
      ref={navigatorRef}
      className={cn(
        'fixed z-20 pointer-events-auto flex flex-col items-center gap-0 '
      )}
      style={{ top: `${position.y}px`, right: `${position.x}px` }}
    >
      <div className='flex items-center gap-1'>
        <Button
          variant='ghost'
          size='icon'
          className='h-6 w-6 bg-transparent text-muted-foreground/60'
          onClick={handleClose}
        >
          <X className='h-3 w-3' />
        </Button>
      </div>

      <div className='flex flex-col gap-2 cursor-grab active:cursor-grabbing'>
        {sections.map((section) => (
          <button
            key={section.uniqueKey}
            onClick={() => onSectionJump(section.index)}
            className={cn(
              'text-xs font-bold py-1 px-3 rounded-full shadow-md transition-all duration-300 cursor-pointer',
              section.uniqueKey === currentSection?.uniqueKey
                ? 'bg-primary text-primary-foreground'
                : 'bg-background/40 text-muted-foreground/60 hover:bg-muted/80 hover:text-muted-foreground'
            )}
          >
            {section.name}
          </button>
        ))}
      </div>
      <span
        className='h-6 w-[50px] text-muted-foreground/60 transition-all duration-300 cursor-move flex items-center justify-center '
        onMouseDown={handleDragMouseDown}
        onTouchStart={handleDragTouchStart}
      >
        <Move className='h-3 w-3' />
      </span>
    </div>
  );
}

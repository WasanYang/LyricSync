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
  initialPosition?: { x: number; y: number };
}

export default function FloatingSectionNavigator({
  sections,
  currentSection,
  onSectionJump,
  onClose,
  initialPosition = { x: 16, y: 300 },
}: FloatingSectionNavigatorProps) {
  const navigatorRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

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

  const handleContainerDragMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Don't drag if clicking on interactive elements
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        return;
      }

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

  const handleContainerDragTouchStart = useCallback(
    (e: React.TouchEvent<HTMLDivElement>) => {
      // Don't drag if touching interactive elements
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON' || target.closest('button')) {
        return;
      }

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

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (isDragging && navigatorRef.current) {
        const touch = e.touches[0];
        const rect = navigatorRef.current.getBoundingClientRect();

        // Calculate new position based on left positioning
        let newX = touch.clientX - dragOffset.x;
        let newY = touch.clientY - dragOffset.y;

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

  // Update position when initialPosition changes
  useEffect(() => {
    setPosition(initialPosition);
  }, [initialPosition]);

  // Don't render if no sections
  if (!sections || sections.length === 0) {
    return null;
  }

  return (
    <div
      ref={navigatorRef}
      className={cn(
        'fixed z-20 pointer-events-auto flex flex-col items-center gap-0 cursor-grab active:cursor-grabbing',
        isDragging && 'cursor-grabbing'
      )}
      style={{ top: `${position.y}px`, right: `${position.x}px` }}
      onMouseDown={handleContainerDragMouseDown}
      onTouchStart={handleContainerDragTouchStart}
    >
      <div className='flex items-center gap-1'>
        <Button
          variant='ghost'
          size='icon'
          className='h-6 w-6 bg-transparent text-muted-foreground/60'
          onClick={onClose}
        >
          <X className='h-3 w-3' />
        </Button>
      </div>

      <div className='flex flex-col gap-2 cursor-grab active:cursor-grabbing'>
        {sections.map((section, index) => (
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
    </div>
  );
}

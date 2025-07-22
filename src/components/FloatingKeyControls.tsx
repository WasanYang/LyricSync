// src/components/FloatingKeyControls.tsx
'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Move, X, Minus, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_NOTES } from '@/lib/chords';

interface FloatingKeyControlsProps {
  showChords: boolean;
  currentKey: string;
  transpose: number;
  onToggleChords: () => void;
  onKeyChange: (key: string) => void;
  onTransposeUp: () => void;
  onTransposeDown: () => void;
  onClose: () => void;
  initialPosition?: { x: number; y: number };
}

export default function FloatingKeyControls({
  showChords,
  currentKey,
  transpose,
  onToggleChords,
  onKeyChange,
  onTransposeUp,
  onTransposeDown,
  onClose,
  initialPosition = { x: window.innerWidth - 200, y: 80 },
}: FloatingKeyControlsProps) {
  const keyControlsRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [position, setPosition] = useState(initialPosition);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const handleDragMouseDown = useCallback(
    (e: React.MouseEvent<HTMLButtonElement>) => {
      if (keyControlsRef.current) {
        setIsDragging(true);
        const rect = keyControlsRef.current.getBoundingClientRect();
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
      if (keyControlsRef.current) {
        setIsDragging(true);
        const touch = e.touches[0];
        const rect = keyControlsRef.current.getBoundingClientRect();
        setDragOffset({
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        });
      }
    },
    []
  );

  const handleContainerDragMouseDown = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      // Don't drag if clicking on interactive elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.closest('button') ||
        target.closest('[role="combobox"]') ||
        target.closest('[role="option"]')
      ) {
        return;
      }

      if (keyControlsRef.current) {
        setIsDragging(true);
        const rect = keyControlsRef.current.getBoundingClientRect();
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
      if (
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT' ||
        target.closest('button') ||
        target.closest('[role="combobox"]') ||
        target.closest('[role="option"]')
      ) {
        return;
      }

      if (keyControlsRef.current) {
        setIsDragging(true);
        const touch = e.touches[0];
        const rect = keyControlsRef.current.getBoundingClientRect();
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
      if (isDragging && keyControlsRef.current) {
        const rect = keyControlsRef.current.getBoundingClientRect();

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
      if (isDragging && keyControlsRef.current) {
        const touch = e.touches[0];
        const rect = keyControlsRef.current.getBoundingClientRect();

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

  return (
    <div
      ref={keyControlsRef}
      className='fixed z-20 pointer-events-auto flex flex-col items-center gap-2'
      style={{
        top: `${position.y}px`,
        right: `${position.x}px`,
      }}
      onMouseDown={handleContainerDragMouseDown}
      onTouchStart={handleContainerDragTouchStart}
    >
      <div className='flex items-center gap-1 mb-1'>
        <Button
          variant='ghost'
          size='icon'
          className='h-6 w-6 bg-transparent text-muted-foreground/60 shadow-sm hover:shadow-md transition-shadow'
          onClick={onClose}
        >
          <X className='h-3 w-3' />
        </Button>
      </div>

      <div className='flex flex-col gap-2'>
        {/* Chords toggle */}
        <Switch
          id='show-chords-quick'
          checked={showChords}
          onCheckedChange={onToggleChords}
          className={cn(
            'w-[50px] h-6 transition-all duration-300 shadow-md',
            showChords ? 'bg-primary' : 'bg-background/40 hover:bg-muted/80'
          )}
        />

        {/* Key controls */}
        <Select value={currentKey} onValueChange={onKeyChange}>
          <SelectTrigger
            className={cn(
              'w-[50px] h-6 text-xs font-bold transition-all duration-300 border-0 bg-background/40 hover:bg-muted/80 shadow-md'
            )}
          >
            <SelectValue placeholder='Key' />
          </SelectTrigger>
          <SelectContent align='start' className='w-[60px] min-w-0'>
            {ALL_NOTES.map((note) => (
              <SelectItem
                key={note}
                value={note}
                className='text-xs cursor-pointer'
              >
                {note}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

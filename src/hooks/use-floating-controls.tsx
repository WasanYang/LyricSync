// src/hooks/use-floating-controls.tsx
'use client';

import { useState, useEffect } from 'react';

export function useFloatingControls() {
  const [isVisible, setIsVisible] = useState(false);

  // Load visibility state from localStorage on mount
  useEffect(() => {
    const savedVisibility = localStorage.getItem('floatingKeyControls-visible');
    if (savedVisibility !== null) {
      setIsVisible(savedVisibility === 'true');
    }
  }, []);

  // Save visibility state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('floatingKeyControls-visible', isVisible.toString());
  }, [isVisible]);

  const toggleVisibility = () => {
    setIsVisible((prev) => !prev);
  };

  const show = () => {
    setIsVisible(true);
  };

  const hide = () => {
    setIsVisible(false);
  };

  return {
    isVisible,
    toggleVisibility,
    show,
    hide,
  };
}


// src/hooks/use-floating-controls.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';

const LOCAL_STORAGE_KEY = 'floatingKeyControls-visible';

export function useFloatingControls() {
  const [isVisible, setIsVisible] = useState(false);

  // Load visibility state from localStorage on mount
  useEffect(() => {
    // This code runs only on the client
    const savedVisibility = localStorage.getItem(LOCAL_STORAGE_KEY);
    // Default to true if no value is saved yet
    setIsVisible(savedVisibility !== 'false');
  }, []);

  const toggleVisibility = useCallback(() => {
    setIsVisible((prev) => {
      const newState = !prev;
      localStorage.setItem(LOCAL_STORAGE_KEY, newState.toString());
      return newState;
    });
  }, []);

  return {
    isVisible,
    toggleVisibility,
  };
}

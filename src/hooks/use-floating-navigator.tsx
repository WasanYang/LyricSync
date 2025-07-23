// src/hooks/use-floating-navigator.tsx
'use client';

import { useState, useEffect } from 'react';

export function useFloatingNavigator() {
  const [isVisible, setIsVisible] = useState(false);

  // Load visibility state from localStorage on mount
  useEffect(() => {
    const savedVisibility = localStorage.getItem(
      'floatingSectionNavigator-visible'
    );
    if (savedVisibility !== null) {
      setIsVisible(savedVisibility === 'true');
    }
  }, []);

  // Save visibility state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem(
      'floatingSectionNavigator-visible',
      isVisible.toString()
    );
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

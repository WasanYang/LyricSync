'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { iOSUtils } from '@/lib/ios-utils';

export function ScrollingDebugger() {
  const [scrollInfo, setScrollInfo] = useState({
    scrollY: 0,
    scrollHeight: 0,
    clientHeight: 0,
    canScroll: false,
  });

  const updateScrollInfo = () => {
    const info = {
      scrollY: window.scrollY,
      scrollHeight: document.documentElement.scrollHeight,
      clientHeight: document.documentElement.clientHeight,
      canScroll:
        document.documentElement.scrollHeight >
        document.documentElement.clientHeight,
    };
    setScrollInfo(info);
  };

  useEffect(() => {
    updateScrollInfo();

    const handleScroll = () => updateScrollInfo();
    const handleResize = () => updateScrollInfo();

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const toggleBouncePrevention = () => {
    const hasClass = document.body.classList.contains('prevent-bounce');
    iOSUtils.setBouncePrevention(!hasClass);
    updateScrollInfo();
  };

  return (
    <Card className='fixed bottom-4 right-4 w-80 z-50 max-h-96 overflow-auto'>
      <CardHeader className='pb-2'>
        <CardTitle className='text-sm'>Scroll Debug</CardTitle>
      </CardHeader>
      <CardContent className='space-y-2 text-xs'>
        <div className='grid grid-cols-2 gap-2'>
          <div>Position: {scrollInfo.scrollY}px</div>
          <div>Height: {scrollInfo.scrollHeight}px</div>
          <div>Client: {scrollInfo.clientHeight}px</div>
          <div>Can Scroll: {scrollInfo.canScroll ? '✅' : '❌'}</div>
        </div>

        <div className='space-y-1'>
          <div>iOS: {iOSUtils.isIOS() ? '✅' : '❌'}</div>
          <div>Safari: {iOSUtils.isSafari() ? '✅' : '❌'}</div>
          <div>PWA: {iOSUtils.isIOSPWA() ? '✅' : '❌'}</div>
          <div>
            Bounce Prevention:{' '}
            {document.body.classList.contains('prevent-bounce') ? '✅' : '❌'}
          </div>
        </div>

        <div className='space-y-1'>
          <Button size='sm' onClick={scrollToTop} className='w-full'>
            Scroll to Top
          </Button>
          <Button size='sm' onClick={scrollToBottom} className='w-full'>
            Scroll to Bottom
          </Button>
          <Button
            size='sm'
            onClick={toggleBouncePrevention}
            className='w-full'
            variant='outline'
          >
            Toggle Bounce Prevention
          </Button>
          <Button
            size='sm'
            onClick={updateScrollInfo}
            className='w-full'
            variant='outline'
          >
            Refresh Info
          </Button>
        </div>

        <div className='bg-muted p-2 rounded text-xs'>
          Body Classes:{' '}
          {Array.from(document.body.classList).join(', ') || 'none'}
        </div>
      </CardContent>
    </Card>
  );
}

'use client';

import React from 'react';
import { iOSUtils } from '@/lib/ios-utils';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; reset: () => void }>;
}

export class IOSErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('iOS Error Boundary caught an error:', error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });

    // Log iOS-specific error details
    if (iOSUtils.isIOS()) {
      console.error('iOS Error Details:', {
        isIOSPWA: iOSUtils.isIOSPWA(),
        isSafari: iOSUtils.isSafari(),
        userAgent: navigator.userAgent,
        error: error.message,
        stack: error.stack,
      });
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;

      return (
        <FallbackComponent error={this.state.error!} reset={this.handleReset} />
      );
    }

    return this.props.children;
  }
}

function DefaultErrorFallback({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const isIOS = iOSUtils.isIOS();
  const errorMessage = iOSUtils.handleIOSError(error);

  return (
    <div className='min-h-screen bg-background flex items-center justify-center p-4'>
      <div className='max-w-md w-full text-center space-y-6'>
        <div className='space-y-4'>
          <div className='mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center'>
            <svg
              className='w-8 h-8 text-destructive'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
              />
            </svg>
          </div>

          <div className='space-y-2'>
            <h1 className='text-2xl font-bold text-foreground'>
              {isIOS ? 'iOS Compatibility Issue' : 'Something went wrong'}
            </h1>
            <p className='text-muted-foreground'>{errorMessage}</p>
          </div>
        </div>

        {isIOS && (
          <div className='bg-muted/50 rounded-lg p-4 text-sm space-y-2'>
            <h3 className='font-semibold'>iOS Tips:</h3>
            <ul className='text-left space-y-1 text-muted-foreground'>
              <li>• Try refreshing the page</li>
              <li>• Clear Safari cache and cookies</li>
              <li>• Disable Private Browsing mode</li>
              <li>• Update iOS to the latest version</li>
              <li>• Try using Chrome instead of Safari</li>
            </ul>
          </div>
        )}

        <div className='space-y-3'>
          <button
            onClick={reset}
            className='w-full bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md font-medium transition-colors'
          >
            Try Again
          </button>

          <button
            onClick={() => window.location.reload()}
            className='w-full bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md font-medium transition-colors'
          >
            Reload Page
          </button>
        </div>

        {process.env.NODE_ENV === 'development' && (
          <details className='text-left text-xs bg-muted p-3 rounded'>
            <summary className='cursor-pointer font-medium'>
              Error Details
            </summary>
            <pre className='mt-2 overflow-auto'>{error.stack}</pre>
          </details>
        )}
      </div>
    </div>
  );
}

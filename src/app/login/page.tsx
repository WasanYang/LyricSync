// src/app/login/page.tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Music, User, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

function GoogleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 48 48" {...props}>
      <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"></path>
      <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"></path>
      <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.222,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"></path>
      <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571l6.19,5.238C43.021,36.251,44,30.638,44,24C44,22.659,43.862,21.35,43.611,20.083z"></path>
    </svg>
  );
}

export default function LoginPage() {
  const { user, signInWithGoogle, signInAnonymously } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);
  
  const handleSignIn = async (method: 'google' | 'guest') => {
    try {
      if (method === 'google') {
        await signInWithGoogle();
      } else {
        await signInAnonymously();
      }
      router.push('/');
    } catch (error) {
      if (error instanceof Error) {
        toast({
          title: "Login Error",
          description: error.message,
          variant: "destructive",
        })
      }
    }
  }

  const handleClose = () => {
    router.push('/welcome');
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 relative">
       <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute top-4 right-4 z-10 h-8 w-8"
      >
          <X className="w-5 h-5" />
          <span className="sr-only">Close</span>
      </Button>
      <div className="w-full max-w-sm flex flex-col items-center text-center">
        <Music className="h-12 w-12 text-primary mb-4" />
        <h1 className="text-2xl font-bold font-headline mb-2">Welcome to Rhythmic Reads</h1>
        <p className="text-muted-foreground mb-8">Sign in to save your setlists and access your songs anywhere.</p>
        <div className="w-full space-y-4">
            <Button onClick={() => handleSignIn('google')} size="lg" className="w-full">
              <GoogleIcon className="mr-2 h-5 w-5" />
              Sign In with Google
            </Button>
            <Button onClick={() => handleSignIn('guest')} size="lg" variant="secondary" className="w-full">
              <User className="mr-2 h-5 w-5" />
              Continue as Guest
            </Button>
        </div>
      </div>
    </div>
  );
}

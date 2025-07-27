'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('user,user', user);
    if (!loading && (!user || user.isAnonymous)) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || !user || user.isAnonymous) {
    return null;
  }

  return <>{children}</>;
}

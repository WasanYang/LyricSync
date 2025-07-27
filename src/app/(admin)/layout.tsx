'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading, isSuperAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || !isSuperAdmin)) {
      router.replace('/');
    }
  }, [user, loading, router]);

  if (loading || !user || !isSuperAdmin) {
    return null;
  }

  return <>{children}</>;
}


'use client'

import { Suspense, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import SongCreator from "@/components/SongCreator";
import { Skeleton } from '@/components/ui/skeleton';

function SongCreatorPageContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/welcome');
    }
  }, [user, authLoading, router]);
  
  if (authLoading || !user) {
    return (
      <div className="flex flex-col h-screen bg-background">
          <header className="flex-shrink-0 p-4 border-b bg-background flex items-center justify-between">
              <Skeleton className="h-8 w-48" />
              <div className="flex gap-2">
                <Skeleton className="h-9 w-28" />
                <Skeleton className="h-9 w-28" />
              </div>
          </header>
          <div className="flex-grow overflow-y-auto p-4 md:p-6 pb-24 w-full max-w-2xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-10 w-full" /></div>
                  <div className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-10 w-full" /></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-10 w-full" /></div>
                   <div className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-10 w-full" /></div>
                   <div className="space-y-2"><Skeleton className="h-4 w-1/3" /><Skeleton className="h-10 w-full" /></div>
              </div>
              <div className="space-y-2 flex-grow flex flex-col">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-64 w-full" />
              </div>
          </div>
      </div>
    );
  }

  return (
    <div className="flex-grow flex flex-col h-screen bg-background">
       <Suspense fallback={<div>Loading editor...</div>}>
          <SongCreator />
       </Suspense>
    </div>
  );
}

export default function SongCreatorPage() {
  return (
      <SongCreatorPageContent />
  )
}

    
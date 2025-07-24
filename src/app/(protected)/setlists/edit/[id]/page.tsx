
'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import SetlistCreator from "@/components/SetlistCreator";
import Header from "@/components/Header";
import BottomNavBar from "@/components/BottomNavBar";
import { Skeleton } from '@/components/ui/skeleton';

function EditSetlistPageContent() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const setlistId = params.id as string;

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/welcome');
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return (
       <div className="flex-grow flex flex-col">
          <Header />
          <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8 flex flex-col">
              <div className="w-full max-w-lg mx-auto h-full flex flex-col space-y-8">
                  <div className="space-y-2">
                      <Skeleton className="h-8 w-3/4" />
                  </div>
                  <div className="flex-grow space-y-4 flex flex-col">
                      <div className="flex justify-between items-center">
                          <Skeleton className="h-7 w-24" />
                          <Skeleton className="h-9 w-9" />
                      </div>
                      <div className="flex-grow">
                          <div className="text-center py-10 border-2 border-dashed rounded-lg flex flex-col justify-center items-center h-full">
                             <Skeleton className="h-5 w-48 mb-2" />
                             <Skeleton className="h-4 w-40" />
                          </div>
                      </div>
                  </div>
                  <Skeleton className="h-11 w-full" />
              </div>
          </main>
          <BottomNavBar />
      </div>
    );
  }


  return (
    <div className="flex-grow flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8 flex flex-col">
        <Suspense fallback={<div>Loading...</div>}>
          <SetlistCreator setlistId={setlistId} />
        </Suspense>
      </main>
      <BottomNavBar />
    </div>
  )
}

export default function EditSetlistPage() {
  return (
    <EditSetlistPageContent />
  );
}

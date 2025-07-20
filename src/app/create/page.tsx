
'use client';

import { Suspense } from 'react';
import SetlistCreator from "@/components/SetlistCreator";
import Header from "@/components/Header";
import BottomNavBar from "@/components/BottomNavBar";

function SetlistCreatorPageContent() {
  return (
    <div className="flex-grow flex flex-col">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pb-24 md:pb-8 flex flex-col">
        <Suspense fallback={<div>Loading...</div>}>
          <SetlistCreator />
        </Suspense>
      </main>
      <BottomNavBar />
    </div>
  )
}

export default function CreatePage() {
  return (
    <SetlistCreatorPageContent />
  );
}

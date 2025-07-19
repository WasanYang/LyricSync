
'use client'

import { Suspense } from 'react';
import SongCreator from "@/components/SongCreator";

function SongCreatorPageContent() {
  return (
    <div className="flex-grow flex flex-col h-screen bg-background">
      <SongCreator />
    </div>
  );
}

export default function SongCreatorPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SongCreatorPageContent />
    </Suspense>
  )
}

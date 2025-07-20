
'use client'

import { Suspense } from 'react';
import SongCreator from "@/components/SongCreator";

function SongCreatorPageContent() {
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

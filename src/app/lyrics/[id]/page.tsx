import { getSongById } from '@/lib/songs';
import { notFound } from 'next/navigation';
import LyricPlayer from '@/components/LyricPlayer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

interface LyricPageProps {
  params: {
    id: string;
  };
}

export default async function LyricPage({ params }: LyricPageProps) {
  const song = await getSongById(params.id);

  if (!song) {
    notFound();
  }

  return (
    <div className="relative w-full min-h-screen bg-background">
      <LyricPlayer song={song} />
    </div>
  );
}

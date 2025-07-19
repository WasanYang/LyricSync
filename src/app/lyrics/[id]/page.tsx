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

export default function LyricPage({ params }: LyricPageProps) {
  const song = getSongById(params.id);

  if (!song) {
    notFound();
  }

  return (
    <div className="relative w-screen h-screen flex items-center justify-center bg-background">
       <Button asChild variant="ghost" className="absolute top-4 left-4 z-10">
        <Link href="/">
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
        </Link>
      </Button>
      <LyricPlayer song={song} />
    </div>
  );
}

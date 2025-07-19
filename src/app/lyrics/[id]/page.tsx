import { getSongById } from '@/lib/songs';
import { notFound } from 'next/navigation';
import LyricPlayer from '@/components/LyricPlayer';

interface LyricPageProps {
  params: {
    id: string;
  };
}

export default async function LyricPage({ params }: LyricPageProps) {
  const { id } = params;
  const song = await getSongById(id);

  if (!song) {
    notFound();
  }

  return (
    <div className="relative w-full min-h-screen bg-background">
      <LyricPlayer song={song} />
    </div>
  );
}

import { getSongById } from '@/lib/songs';
import { notFound } from 'next/navigation';
import LyricPlayer from '@/components/LyricPlayer';

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
    <div>
      <LyricPlayer song={song} />
    </div>
  );
}

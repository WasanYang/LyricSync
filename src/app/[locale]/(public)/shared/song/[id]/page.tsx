'use client';
// No longer a server component, data fetching is delegated to SongDetail
import { SongDetail } from '@/components/SongDetail';
import { useParams } from 'next/navigation';

export default function SharedSongPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  return <SongDetail songId={id ?? ''} showPlayerLink={true} isSharePage />;
}

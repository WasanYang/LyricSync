'use client';
import { useParams } from 'next/navigation';
import { SongDetail } from '@/components/SongDetail';
import { getCloudSongById } from '@/lib/db';
import type { Song } from '@/lib/songs';

export default function SongDetailPage() {
  const params = useParams();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;

  // Let SongDetail handle its own data fetching and state
  return <SongDetail songId={id ?? ''} showPlayerLink={true} />;
}

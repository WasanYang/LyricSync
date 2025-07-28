'use client';
import { SongDetail } from '@/components/SongDetail';
import { getCloudSongById } from '@/lib/db';
import { generatePageMetadata } from '@/app/metadata';
import type { Metadata } from 'next';
import type { Song } from '@/lib/songs';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const song: Song | null = await getCloudSongById(params.id);

  if (!song) {
    return generatePageMetadata.search(); // Return default metadata if not found
  }

  return generatePageMetadata.song(song);
}

export default function SongDetailPage({ params }: Props) {
  const id = Array.isArray(params.id) ? params.id[0] : params.id ?? '';
  return <SongDetail songId={id} showPlayerLink={true} isSharePage />;
}

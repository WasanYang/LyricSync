// src/app/[locale]/(public)/shared/song/[id]/player/v2/page.tsx
import { LyricPlayerV2 } from '@/components/LyricPlayerV2/LyricPlayerV2';
import { getCloudSongById } from '@/lib/db';
import { notFound } from 'next/navigation';

type Props = {
  params: { id: string; locale?: string };
};

export default async function LyricPlayerPageV2({ params }: Props) {
  const { id } = await params;
  const song = await getCloudSongById(id);

  if (!song) {
    notFound();
  }

  return <LyricPlayerV2 song={song} />;
}

// ...existing code...
// src/app/(public)/shared/song/[id]/page.tsx
import { SongDetail } from '@/components/SongDetail';
import { getCloudSongById } from '@/lib/db';
import { generateMetadata as buildMetadata, pageSEOConfigs } from '@/lib/seo';
import type { Metadata } from 'next';
import type { Song } from '@/lib/songs';

type Props = {
  params: { id: string };
};

// This function now correctly runs on the server.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const song: Song | null = await getCloudSongById(params.id);
  if (!song) {
    // Return default metadata if the song is not found
    return buildMetadata(pageSEOConfigs.search());
  }
  // Use song details for SEO
  return buildMetadata(
    pageSEOConfigs.songDetails({
      title: song.title,
      artist: song.artist,
      originalKey: song.originalKey,
    })
  );
}

// This is now a Server Component
export default function SongDetailPage({ params }: Props) {
  const id = params.id ?? '';
  return <SongDetail songId={id} showPlayerLink={true} isSharePage />;
}

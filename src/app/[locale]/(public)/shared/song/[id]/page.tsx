import { SongDetail } from '@/components/SongDetail';
import { getCloudSongById } from '@/lib/db';
import { generateMetadata as buildMetadata, pageSEOConfigs } from '@/lib/seo';
import type { Metadata } from 'next';
import type { Song } from '@/lib/songs';

type Props = {
  params: { id: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const song: Song | null = await getCloudSongById(params.id);
  if (!song) {
    return buildMetadata(pageSEOConfigs.search());
  }
  return buildMetadata(
    pageSEOConfigs.songDetails({
      title: song.title,
      artist: song.artist,
      originalKey: song.originalKey,
    })
  );
}

export default function SongDetailPage({ params }: Props) {
  const id = params.id ?? '';
  return <SongDetail songId={id} showPlayerLink={true} isSharePage />;
}

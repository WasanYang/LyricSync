import { getCloudSongById } from '@/lib/db';
import { generateMetadata as buildMetadata, pageSEOConfigs } from '@/lib/seo';
import type { Metadata } from 'next';
import type { Song } from '@/lib/songs';
import Head from 'next/head';
type Props = {
  params: { id: string; locale?: string };
};

export async function generateMetadata({
  params,
}: Props & { params: { id: string; locale?: string } }): Promise<Metadata> {
  const { id, locale = 'th' } = await params;
  const song: Song | null = await getCloudSongById(id);
  if (!song) {
    return buildMetadata(pageSEOConfigs.search());
  }
  return buildMetadata(
    pageSEOConfigs.songDetails(
      {
        id: song.id,
        title: song.title,
        artist: song.artist,
        originalKey: song.originalKey,
        lyrics: Array.isArray(song.lyrics)
          ? song.lyrics
              .map((l) => l.text)
              .join('\n')
              .replace(/\[[^\]]+\]|\([^\)]*\)/g, '')
          : typeof song.lyrics === 'string'
          ? (song.lyrics as string).replace(/\[[^\]]+\]|\([^\)]*\)/g, '')
          : '',
      },
      locale as 'th' | 'en'
    )
  );
}

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { id: string; locale: string };
}) {
  const { id, locale } = await params;
  const song: Song | null = await getCloudSongById(id);

  // Prepare JSON-LD structured data
  let jsonLd = '';
  if (song) {
    const lyricsText = Array.isArray(song.lyrics)
      ? song.lyrics
          .map((l) => l.text)
          .join('\n')
          .replace(/\[[^\]]+\]|\([^\)]*\)/g, '')
      : typeof song.lyrics === 'string'
      ? (song.lyrics as string).replace(/\[[^\]]+\]|\([^\)]*\)/g, '')
      : '';
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'MusicComposition',
      name: song.title,
      composer: song.artist,
      inLanguage: locale || 'th',
      lyrics: lyricsText,
      identifier: song.id,
    };
    jsonLd = JSON.stringify(structuredData);
  }
  return (
    <>
      <Head>
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      </Head>
      {children}
    </>
  );
}

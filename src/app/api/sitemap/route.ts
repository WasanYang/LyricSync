import { NextResponse } from 'next/server';

export async function GET() {
  const { getAllCloudSongs } = await import('@/lib/db');
  const songs = await getAllCloudSongs();
  const locales = ['th', 'en'];

  let urls = [
    {
      loc: 'https://lyricsync.app/',
      lastmod: '2025-08-02',
      alternates: locales.map((l) => ({
        hreflang: l,
        href: `https://lyricsync.app/${l}/`,
      })),
    },
    {
      loc: 'https://lyricsync.app/premium',
      lastmod: '2025-08-02',
      alternates: locales.map((l) => ({
        hreflang: l,
        href: `https://lyricsync.app/${l}/premium`,
      })),
    },
  ];

  songs.forEach((song) => {
    locales.forEach((locale) => {
      urls.push({
        loc: `https://lyricsync.app/${locale}/shared/song/${song.id}/`,
        lastmod:
          song.updatedAt instanceof Date
            ? song.updatedAt.toISOString().slice(0, 10)
            : new Date(song.updatedAt).toISOString().slice(0, 10),
        alternates: locales.map((l) => ({
          hreflang: l,
          href: `https://lyricsync.app/${l}/shared/song/${song.id}/`,
        })),
      });
    });
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls
  .map(
    (u) => `
  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
    ${
      u.alternates
        ? u.alternates
            .map(
              (a) =>
                `<xhtml:link rel="alternate" hreflang="${a.hreflang}" href="${a.href}" />`
            )
            .join('')
        : ''
    }
  </url>
`
  )
  .join('')}
</urlset>`;

  return new NextResponse(xml, {
    headers: { 'Content-Type': 'application/xml' },
  });
}

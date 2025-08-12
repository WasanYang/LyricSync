import { NextResponse } from 'next/server';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { defaultSEOConfig } from '@/lib/seo';
import type { Song } from '@/lib/songs';

const { siteUrl } = defaultSEOConfig;
const locales = ['th', 'en'];

export async function GET() {
  if (!db) {
    return new NextResponse('Internal Server Error: Firebase not initialized', {
      status: 500,
    });
  }

  try {
    const songsCollection = collection(db, 'songs');
    const q = query(songsCollection, where('source', '==', 'system'));
    const querySnapshot = await getDocs(q);

    const songs: Song[] = [];
    querySnapshot.forEach((doc) => {
      songs.push({ id: doc.id, ...doc.data() } as Song);
    });

    const urls = songs
      .map((song) => {
        let lastModDate: Date;
        if (song.updatedAt && typeof song.updatedAt === 'number') {
          lastModDate = new Date(song.updatedAt);
        } else if (
          song.updatedAt &&
          typeof (song.updatedAt as any).toDate === 'function'
        ) {
          lastModDate = (song.updatedAt as any).toDate();
        } else {
          lastModDate = new Date();
        }
        const lastMod = lastModDate.toISOString().split('T')[0];
        return `
    <url>
      <loc>${siteUrl}/th/shared/song/${song.id}</loc>
      <lastmod>${lastMod}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
      ${locales
        .map(
          (locale) =>
            `<xhtml:link rel="alternate" hreflang="${locale}" href="${siteUrl}/${locale}/shared/song/${song.id}" />`
        )
        .join('')}
    </url>`;
      })
      .join('');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
          xmlns:xhtml="http://www.w3.org/1999/xhtml">
  ${urls}
  </urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 's-maxage=3600, stale-while-revalidate', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('Error generating song sitemap:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

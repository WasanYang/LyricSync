// src/app/sitemap-pages.xml/route.ts
import { NextResponse } from 'next/server';
import { defaultSEOConfig } from '@/lib/seo';

const { siteUrl } = defaultSEOConfig;
const locales = ['th', 'en'];

export async function GET() {
  const staticPages = ['/', '/welcome', '/premium', '/donate'];

  const urls = staticPages
    .map((page) => {
      return `
  <url>
    <loc>${siteUrl}${page}</loc>
    <lastmod>2024-08-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>${page === '/' ? '1.0' : '0.7'}</priority>
    ${locales
      .map(
        (locale) =>
          `<xhtml:link rel="alternate" hreflang="${locale}" href="${siteUrl}/${locale}${
            page === '/' ? '' : page
          }" />`
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
}

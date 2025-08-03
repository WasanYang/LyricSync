// src/app/sitemap.xml/route.ts
import { NextResponse } from 'next/server';
import { defaultSEOConfig } from '@/lib/seo';

const { siteUrl } = defaultSEOConfig;

export async function GET() {
  const sitemaps = [
    '/sitemap-pages.xml',
    '/sitemap-songs.xml',
    // '/sitemap-setlists.xml', // Add this back when ready
  ];

  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemaps
    .map(
      (path) => `
  <sitemap>
    <loc>${siteUrl}${path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`
    )
    .join('')}
</sitemapindex>`;

  return new NextResponse(sitemapIndex, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 's-maxage=3600, stale-while-revalidate', // Cache for 1 hour
    },
  });
}

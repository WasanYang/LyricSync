// src/app/robots.ts
import { MetadataRoute } from 'next';
import { defaultSEOConfig } from '@/lib/seo';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = defaultSEOConfig.siteUrl;

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/welcome',
          '/login',
          '/premium',
          '/library',
          '/search',
          '/setlists',
          '/create',
          '/song-editor',
          '/profile',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/_next/',
          '/private/',
          '/*.json',
          '/setlists/edit/',
          '/lyrics/*/player',
          '/setlists/*/player',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/welcome',
          '/premium',
          '/library',
          '/search',
          '/setlists',
        ],
        disallow: [
          '/admin/',
          '/api/',
          '/_next/',
          '/private/',
          '/login',
          '/create',
          '/song-editor',
          '/profile',
          '/setlists/edit/',
          '/lyrics/*/player',
          '/setlists/*/player',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}

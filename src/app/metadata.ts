// src/app/metadata.ts
// Centralized metadata configuration

import type { Metadata, Viewport } from 'next';
import {
  generateMetadata,
  pageSEOConfigs,
  generateStructuredData,
} from '@/lib/seo';
import type { Song } from '@/lib/songs';

// Default metadata for the application
export const metadata: Metadata = {
  ...generateMetadata(pageSEOConfigs.home()),
  manifest: '/manifest.json',
  other: {
    // PWA Meta Tags
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'default',
    'apple-mobile-web-app-title': 'LyricSync',
    'mobile-web-app-capable': 'yes',
    'application-name': 'LyricSync',

    // Windows Tiles
    'msapplication-TileColor': '#3AAFA9',
    'msapplication-TileImage': '/icons/logo-144.webp',

    // Additional PWA
    'format-detection': 'telephone=no',
  },
  icons: {
    icon: '/icons/logo.webp',
    apple: '/icons/logo-180.webp',
  },
};

// Viewport configuration
export const viewport: Viewport = {
  themeColor: '#3AAFA9',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

// Dynamic metadata generators for different page types
export const generatePageMetadata = {
  song: (song: Song) =>
    generateMetadata(
      pageSEOConfigs.songDetails({
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
      })
    ),

  setlist: (setlist: {
    title: string;
    authorName: string;
    songCount: number;
  }) => generateMetadata(pageSEOConfigs.setlistDetails(setlist)),

  search: (query?: string) => generateMetadata(pageSEOConfigs.search(query)),

  library: () => generateMetadata(pageSEOConfigs.library()),

  login: () => generateMetadata(pageSEOConfigs.login()),

  premium: () => generateMetadata(pageSEOConfigs.premium()),

  welcome: () => generateMetadata(pageSEOConfigs.welcome()),

  offline: () => generateMetadata(pageSEOConfigs.offline()),
};

// Structured data generators
export const structuredDataGenerators = generateStructuredData;

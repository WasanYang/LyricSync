// src/app/metadata.ts
// Centralized metadata configuration

import type { Metadata, Viewport } from 'next';
import {
  generateMetadata,
  defaultSEOConfig,
  pageSEOConfigs,
  generateStructuredData,
} from '@/lib/seo';

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
    'msapplication-TileImage': '/icons/logo-144.png',

    // Additional PWA
    'format-detection': 'telephone=no',
  },
  icons: {
    icon: '/icons/logo.png',
    apple: '/icons/logo-180.png',
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
  song: (song: { title: string; artist: string; originalKey?: string }) =>
    generateMetadata(pageSEOConfigs.songDetails(song)),

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

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
export const metadata: Metadata = generateMetadata(pageSEOConfigs.home());

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


import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  scope: '/',
  start_url: '/',
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  workboxOptions: {
    disableDevLogs: true,
  },
  extendManifest: (manifest) => {
    manifest.id = '/';
    manifest.shortcuts = [
      {
        name: 'Search Songs',
        short_name: 'Search',
        description: 'Search for songs and setlists',
        url: '/search',
        icons: [{ src: '/icons/search.png', sizes: '192x192' }],
      },
      {
        name: 'My Setlists',
        short_name: 'Setlists',
        description: 'View and manage your setlists',
        url: '/setlists',
        icons: [{ src: '/icons/setlist.png', sizes: '192x192' }],
      },
      {
        name: 'Create Setlist',
        short_name: 'Create',
        description: 'Create a new setlist',
        url: '/setlists/create',
        icons: [{ src: '/icons/create.png', sizes: '192x192' }],
      },
    ];
    manifest.share_target = {
      action: '/shared/target',
      method: 'GET',
      params: {
        title: 'title',
        text: 'text',
        url: 'url',
      },
    };
    return manifest;
  },
});

import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin({
  experimental: {
    createMessagesDeclaration: './src/messages/th.json',
  },
});
const nextConfig: NextConfig = {
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_SITE_URL: 'https://lyricsync.app',
  },
  webpack: (config, { isServer }) => {
    // This is the fix for the @grpc/proto-loader error
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        './util': false,
        './resolver': false,
        './path': false,
        './package': false,
      };
    }
    config.externals.push('original-fs');
    return config;
  },
};

export default withPWA(withNextIntl(nextConfig));

import type { NextConfig } from 'next';
import withPWAInit from '@ducanh2912/next-pwa';

const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
});

import createNextIntlPlugin from 'next-intl/plugin';
const withNextIntl = createNextIntlPlugin({
  requestConfig: 'src/i18n/request.ts',
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
  // i18n: {
  //   locales: ['th', 'en'],
  //   defaultLocale: 'th',
  //   localeDetection: false,
  // },
};

export default withPWA(withNextIntl(nextConfig));

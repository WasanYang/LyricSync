// src/lib/seo.ts
// SEO utilities and configurations

import type { Metadata } from 'next';

export interface SEOConfig {
  title: string;
  description: string;
  keywords?: string[];
  canonicalUrl?: string;
  noIndex?: boolean;
  noFollow?: boolean;
  openGraph?: {
    title?: string;
    description?: string;
    type?: 'website' | 'article' | 'music.song' | 'music.album';
    images?: Array<{
      url: string;
      width?: number;
      height?: number;
      alt?: string;
    }>;
    siteName?: string;
    locale?: string;
  };
  twitter?: {
    card?: 'summary' | 'summary_large_image' | 'app' | 'player';
    title?: string;
    description?: string;
    images?: string[];
    creator?: string;
    site?: string;
  };
  alternates?: {
    canonical?: string;
    languages?: Record<string, string>;
  };
  jsonLd?: Record<string, any>;
}

export const defaultSEOConfig = {
  siteName: 'LyricSync',
  siteUrl: process.env.NEXT_PUBLIC_SITE_URL || 'https://lyricsync.app',
  defaultTitle:
    'LyricSync - เนื้อเพลง คอร์ด สร้างและเล่นเซ็ทลิสต์สำหรับทุกโอกาส',
  defaultDescription:
    'รวมเนื้อเพลง คอร์ด สร้างเซ็ทลิสต์ และเล่นเพลงโปรดของคุณได้ทุกที่ ทุกโอกาส ใช้งานง่ายสำหรับทุกคน ไม่จำกัดเฉพาะกลุ่มใด',
  defaultKeywords: [
    'เพลงนมัสการ',
    'worship songs',
    'คอร์ดเพลงคริสเตียน',
    'christian chords',
    'เนื้อเพลงคริสเตียน',
    'setlist',
    'ระบบนมัสการ',
    'คริสตจักร',
    'เครื่องมือนมัสการ',
    'worship tools',
    'auto scroll lyrics',
    'chord display',
  ],
  twitterHandle: '@lyricsync',
  locale: 'th_TH',
  defaultImage: '/icons/logo-512.png',
  logo: '/icons/logo-512.png',
};

export function generateMetadata(config: SEOConfig): Metadata {
  const {
    title,
    description,
    keywords = [],
    canonicalUrl,
    noIndex = false,
    noFollow = false,
    openGraph,
    twitter,
    alternates,
  } = config;

  const fullTitle = title.includes(defaultSEOConfig.siteName)
    ? title
    : `${title} | ${defaultSEOConfig.siteName}`;

  const metadata: Metadata = {
    title: fullTitle,
    description,
    keywords: [...defaultSEOConfig.defaultKeywords, ...keywords].join(', '),

    // Robots
    robots: {
      index: !noIndex,
      follow: !noFollow,
      googleBot: {
        index: !noIndex,
        follow: !noFollow,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },

    // Open Graph
    openGraph: {
      title: openGraph?.title || fullTitle,
      description: openGraph?.description || description,
      type: openGraph?.type || 'website',
      siteName: openGraph?.siteName || defaultSEOConfig.siteName,
      locale: openGraph?.locale || defaultSEOConfig.locale,
      url: canonicalUrl || defaultSEOConfig.siteUrl,
      images: openGraph?.images || [
        {
          url: `${defaultSEOConfig.siteUrl}${defaultSEOConfig.defaultImage}`,
          width: 512,
          height: 512,
          alt: defaultSEOConfig.siteName,
        },
      ],
    },

    // Twitter
    twitter: {
      card: twitter?.card || 'summary_large_image',
      title: twitter?.title || fullTitle,
      description: twitter?.description || description,
      images: twitter?.images || [
        `${defaultSEOConfig.siteUrl}${defaultSEOConfig.defaultImage}`,
      ],
      creator: twitter?.creator || defaultSEOConfig.twitterHandle,
      site: twitter?.site || defaultSEOConfig.twitterHandle,
    },

    // Alternates
    alternates: {
      canonical: alternates?.canonical || canonicalUrl,
      languages: alternates?.languages || {
        'th-TH': defaultSEOConfig.siteUrl,
        'en-US': `${defaultSEOConfig.siteUrl}/en`,
      },
    },

    // Additional meta tags
    other: {
      'application-name': defaultSEOConfig.siteName,
      'apple-mobile-web-app-title': defaultSEOConfig.siteName,
      'format-detection': 'telephone=no',
      'mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-capable': 'yes',
      'apple-mobile-web-app-status-bar-style': 'default',
    },
  };

  return metadata;
}

// Page-specific SEO configurations
export const pageSEOConfigs = {
  home: (): SEOConfig => ({
    title: 'LyricSync - เนื้อเพลง คอร์ด สร้างและเล่นเซ็ทลิสต์สำหรับทุกโอกาส',
    description:
      'รวมเนื้อเพลง คอร์ด สร้างเซ็ทลิสต์ และเล่นเพลงโปรดของคุณได้ทุกที่ ทุกโอกาส ใช้งานง่ายสำหรับทุกคน ไม่จำกัดเฉพาะกลุ่มใด',
    keywords: [
      'หน้าแรก',
      'เนื้อเพลง',
      'คอร์ด',
      'เซ็ทลิสต์',
      'player',
      'LyricSync',
    ],
    openGraph: {
      type: 'website',
      title: 'LyricSync - เนื้อเพลง คอร์ด สร้างและเล่นเซ็ทลิสต์สำหรับทุกโอกาส',
      description:
        'รวมเนื้อเพลง คอร์ด สร้างเซ็ทลิสต์ และเล่นเพลงโปรดของคุณได้ทุกที่ ทุกโอกาส ใช้งานง่ายสำหรับทุกคน',
      images: [
        {
          url: `${defaultSEOConfig.siteUrl}/icons/logo-512.png`,
          width: 512,
          height: 512,
          alt: 'LyricSync Logo',
        },
      ],
      siteName: defaultSEOConfig.siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title: 'LyricSync - เนื้อเพลง คอร์ด สร้างและเล่นเซ็ทลิสต์สำหรับทุกโอกาส',
      description:
        'รวมเนื้อเพลง คอร์ด สร้างเซ็ทลิสต์ และเล่นเพลงโปรดของคุณได้ทุกที่ ทุกโอกาส ใช้งานง่ายสำหรับทุกคน',
      images: [`${defaultSEOConfig.siteUrl}/icons/logo-512.png`],
    },
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'LyricSync',
      description:
        'รวมเนื้อเพลง คอร์ด สร้างเซ็ทลิสต์ และเล่นเพลงโปรดของคุณได้ทุกที่ ทุกโอกาส ใช้งานง่ายสำหรับทุกคน',
      url: defaultSEOConfig.siteUrl,
      logo: `${defaultSEOConfig.siteUrl}/icons/logo-512.png`,
      applicationCategory: 'MusicApplication',
      operatingSystem: 'Web',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'THB',
      },
    },
  }),

  welcome: (): SEOConfig => ({
    title: 'LyricSync - รวมเนื้อเพลง คอร์ด สร้างและเล่นเซ็ทลิสต์สำหรับทุกโอกาส',
    description:
      'ยินดีต้อนรับสู่ LyricSync แอปสำหรับทุกคนที่ต้องการจัดการเนื้อเพลง คอร์ด สร้างเซ็ทลิสต์ และเล่นเพลงโปรดได้ทุกที่ ทุกโอกาส รองรับ auto-scroll, player, และแชร์เพลง',
    keywords: [
      'welcome',
      'แนะนำ',
      'ฟีเจอร์',
      'เซ็ทลิสต์',
      'player',
      'เนื้อเพลง',
      'คอร์ด',
      'เริ่มต้น',
      'LyricSync',
    ],
    openGraph: {
      type: 'website',
      title:
        'LyricSync - รวมเนื้อเพลง คอร์ด สร้างและเล่นเซ็ทลิสต์สำหรับทุกโอกาส',
      description:
        'ยินดีต้อนรับสู่ LyricSync แอปสำหรับทุกคนที่ต้องการจัดการเนื้อเพลง คอร์ด สร้างเซ็ทลิสต์ และเล่นเพลงโปรดได้ทุกที่ ทุกโอกาส รองรับ auto-scroll, player, และแชร์เพลง',
      images: [
        {
          url: `${defaultSEOConfig.siteUrl}/icons/logo-512.png`,
          width: 512,
          height: 512,
          alt: 'LyricSync Logo',
        },
      ],
      siteName: defaultSEOConfig.siteName,
    },
    twitter: {
      card: 'summary_large_image',
      title:
        'LyricSync - รวมเนื้อเพลง คอร์ด สร้างและเล่นเซ็ทลิสต์สำหรับทุกโอกาส',
      description:
        'ยินดีต้อนรับสู่ LyricSync แอปสำหรับทุกคนที่ต้องการจัดการเนื้อเพลง คอร์ด สร้างเซ็ทลิสต์ และเล่นเพลงโปรดได้ทุกที่ ทุกโอกาส รองรับ auto-scroll, player, และแชร์เพลง',
      images: [`${defaultSEOConfig.siteUrl}/icons/logo-512.png`],
    },
  }),

  songDetails: (song: {
    title: string;
    artist: string;
    originalKey?: string;
  }): SEOConfig => ({
    title: `${song.title} - ${song.artist}`,
    description: `เนื้อเพลง "${song.title}" โดย ${song.artist}${
      song.originalKey ? ` คีย์ ${song.originalKey}` : ''
    } พร้อมคอร์ดและระบบเล่นอัตโนมัติ`,
    keywords: [
      song.title,
      song.artist,
      'เนื้อเพลง',
      'คอร์ด',
      'lyrics',
      'chords',
    ],
    openGraph: {
      type: 'music.song',
      title: `${song.title} - ${song.artist}`,
    },
  }),

  setlistDetails: (setlist: {
    title: string;
    authorName: string;
    songCount: number;
  }): SEOConfig => ({
    title: `${setlist.title} - Setlist`,
    description: `Setlist "${setlist.title}" โดย ${setlist.authorName} มี ${setlist.songCount} เพลง พร้อมระบบเล่นต่อเนื่องและการแสดงคอร์ด`,
    keywords: [
      setlist.title,
      setlist.authorName,
      'setlist',
      'playlist',
      'เพลงนมัสการ',
    ],
    openGraph: {
      type: 'music.album',
    },
  }),

  search: (query?: string): SEOConfig => ({
    title: query ? `ค้นหา "${query}"` : 'ค้นหาเพลงและ Setlist',
    description: query
      ? `ผลการค้นหา "${query}" ใน LyricSync - เพลงนมัสการ คอร์ด และ setlist`
      : 'ค้นหาเพลงนมัสการ คอร์ด และ setlist ได้ที่นี่ รองรับการค้นหาภาษาไทยและอังกฤษ',
    keywords: query ? [query, 'ค้นหา'] : ['ค้นหา', 'search'],
    noIndex: !!query, // Don't index search result pages
  }),

  library: (): SEOConfig => ({
    title: 'คลังเพลงของฉัน',
    description:
      'คลังเพลงส่วนตัว เพลงที่บันทึกไว้ และ setlist ที่สร้างขึ้น พร้อมการจัดการและแก้ไข',
    keywords: ['คลังเพลง', 'library', 'เพลงที่บันทึก', 'setlist ของฉัน'],
    noIndex: true, // Private content
  }),

  login: (): SEOConfig => ({
    title: 'เข้าสู่ระบบ',
    description:
      'เข้าสู่ระบบ LyricSync เพื่อบันทึกเพลง สร้าง setlist และซิงค์ข้อมูลข้ามอุปกรณ์',
    keywords: ['เข้าสู่ระบบ', 'login', 'สมัครสมาชิก'],
    noIndex: true,
  }),

  premium: (): SEOConfig => ({
    title: 'LyricSync Premium',
    description:
      'อัปเกรดเป็น Premium สมาชิก รับฟีเจอร์เพิ่มเติม เนื้อที่จัดเก็บไม่จำกัด และการสนับสนุนพิเศษ',
    keywords: ['premium', 'อัปเกรด', 'สมาชิกพิเศษ', 'subscription'],
  }),

  offline: (): SEOConfig => ({
    title: 'โหมดออฟไลน์',
    description:
      'ใช้งาน LyricSync ได้แม้ไม่มีอินเทอร์เน็ต ด้วยโหมดออฟไลน์ที่บันทึกเพลงและ setlist ไว้ในเครื่อง',
    keywords: ['offline', 'ออฟไลน์', 'ไม่มีเน็ต'],
    noIndex: true,
  }),
};

// Structured Data (JSON-LD) generators
export const generateStructuredData = {
  website: () => ({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: defaultSEOConfig.siteName,
    url: defaultSEOConfig.siteUrl,
    description: defaultSEOConfig.defaultDescription,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${defaultSEOConfig.siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }),

  musicComposition: (song: {
    title: string;
    artist: string;
    originalKey?: string;
    lyrics?: string;
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'MusicComposition',
    name: song.title,
    composer: {
      '@type': 'Person',
      name: song.artist,
    },
    musicalKey: song.originalKey,
    lyrics: song.lyrics
      ? {
          '@type': 'CreativeWork',
          text: song.lyrics,
        }
      : undefined,
    genre: 'Christian Music',
    inLanguage: 'th-TH',
  }),

  musicPlaylist: (setlist: {
    title: string;
    authorName: string;
    description?: string;
    songs: Array<{ title: string; artist: string }>;
  }) => ({
    '@context': 'https://schema.org',
    '@type': 'MusicPlaylist',
    name: setlist.title,
    description: setlist.description,
    creator: {
      '@type': 'Person',
      name: setlist.authorName,
    },
    numTracks: setlist.songs.length,
    track: setlist.songs.map((song, index) => ({
      '@type': 'MusicRecording',
      name: song.title,
      byArtist: {
        '@type': 'Person',
        name: song.artist,
      },
      position: index + 1,
    })),
    genre: 'Christian Music',
    inLanguage: 'th-TH',
  }),

  organization: () => ({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: defaultSEOConfig.siteName,
    url: defaultSEOConfig.siteUrl,
    logo: `${defaultSEOConfig.siteUrl}${defaultSEOConfig.defaultImage}`,
    description: defaultSEOConfig.defaultDescription,
    sameAs: [
      // Add social media links here
    ],
  }),

  breadcrumbList: (items: Array<{ name: string; url: string }>) => ({
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }),
};

// Sitemap generator helper
export const generateSitemapEntry = (
  url: string,
  options: {
    lastModified?: Date;
    changeFrequency?:
      | 'always'
      | 'hourly'
      | 'daily'
      | 'weekly'
      | 'monthly'
      | 'yearly'
      | 'never';
    priority?: number;
  } = {}
) => ({
  url: `${defaultSEOConfig.siteUrl}${url}`,
  lastModified: options.lastModified || new Date(),
  changeFrequency: options.changeFrequency || 'weekly',
  priority: options.priority || 0.5,
});

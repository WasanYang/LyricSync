// src/components/SEOHead.tsx
// SEO Head component for dynamic meta tags and structured data

'use client';

import Head from 'next/head';
import { usePathname } from 'next/navigation';
import { defaultSEOConfig, type SEOConfig } from '@/lib/seo';

interface SEOHeadProps {
  config: SEOConfig;
  structuredData?: Record<string, any> | Array<Record<string, any>>;
}

export default function SEOHead({ config, structuredData }: SEOHeadProps) {
  const pathname = usePathname();

  const {
    title,
    description,
    keywords = [],
    canonicalUrl,
    noIndex = false,
    noFollow = false,
    openGraph,
    twitter,
  } = config;

  const fullTitle = title.includes(defaultSEOConfig.siteName)
    ? title
    : `${title} | ${defaultSEOConfig.siteName}`;

  const canonical = canonicalUrl || `${defaultSEOConfig.siteUrl}${pathname}`;

  return (
    <Head>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name='description' content={description} />
      {keywords.length > 0 && (
        <meta
          name='keywords'
          content={[...defaultSEOConfig.defaultKeywords, ...keywords].join(
            ', '
          )}
        />
      )}

      {/* Canonical URL */}
      <link rel='canonical' href={canonical} />

      {/* Robots */}
      <meta
        name='robots'
        content={`${noIndex ? 'noindex' : 'index'},${
          noFollow ? 'nofollow' : 'follow'
        }`}
      />
      <meta
        name='googlebot'
        content={`${noIndex ? 'noindex' : 'index'},${
          noFollow ? 'nofollow' : 'follow'
        },max-video-preview:-1,max-image-preview:large,max-snippet:-1`}
      />

      {/* Open Graph */}
      <meta property='og:type' content={openGraph?.type || 'website'} />
      <meta property='og:title' content={openGraph?.title || fullTitle} />
      <meta
        property='og:description'
        content={openGraph?.description || description}
      />
      <meta property='og:url' content={canonical} />
      <meta
        property='og:site_name'
        content={openGraph?.siteName || defaultSEOConfig.siteName}
      />
      <meta
        property='og:locale'
        content={openGraph?.locale || defaultSEOConfig.locale}
      />

      {/* Facebook recommended og:image (absolute URL, 1200x630px) */}
      <meta
        property='og:image'
        content='https://lyricsync.app/icons/logo-1200x630.png'
      />
      <meta property='og:image:width' content='1200' />
      <meta property='og:image:height' content='630' />
      <meta property='og:image:alt' content='LyricSync Logo' />
      {/* Fallback to config og:image if provided */}
      {openGraph?.images?.[0] && (
        <>
          <meta property='og:image' content={openGraph.images[0].url} />
          {openGraph.images[0].width && (
            <meta
              property='og:image:width'
              content={openGraph.images[0].width.toString()}
            />
          )}
          {openGraph.images[0].height && (
            <meta
              property='og:image:height'
              content={openGraph.images[0].height.toString()}
            />
          )}
          {openGraph.images[0].alt && (
            <meta property='og:image:alt' content={openGraph.images[0].alt} />
          )}
        </>
      )}

      {/* Twitter */}
      <meta
        name='twitter:card'
        content={twitter?.card || 'summary_large_image'}
      />
      <meta name='twitter:title' content={twitter?.title || fullTitle} />
      <meta
        name='twitter:description'
        content={twitter?.description || description}
      />
      {twitter?.creator && (
        <meta name='twitter:creator' content={twitter.creator} />
      )}
      {twitter?.site && <meta name='twitter:site' content={twitter.site} />}
      {twitter?.images?.[0] && (
        <meta name='twitter:image' content={twitter.images[0]} />
      )}

      {/* Additional Meta Tags */}
      <meta name='application-name' content={defaultSEOConfig.siteName} />
      <meta
        name='apple-mobile-web-app-title'
        content={defaultSEOConfig.siteName}
      />
      <meta name='format-detection' content='telephone=no' />
      <meta name='mobile-web-app-capable' content='yes' />
      <meta name='apple-mobile-web-app-capable' content='yes' />
      <meta name='apple-mobile-web-app-status-bar-style' content='default' />

      {/* Language Alternates */}
      <link
        rel='alternate'
        hrefLang='th-TH'
        href={`${defaultSEOConfig.siteUrl}${pathname}`}
      />
      <link
        rel='alternate'
        hrefLang='en-US'
        href={`${defaultSEOConfig.siteUrl}/en${pathname}`}
      />
      <link
        rel='alternate'
        hrefLang='x-default'
        href={`${defaultSEOConfig.siteUrl}${pathname}`}
      />

      {/* Structured Data */}
      {structuredData && (
        <script
          type='application/ld+json'
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(
              Array.isArray(structuredData) ? structuredData : [structuredData]
            ),
          }}
        />
      )}
    </Head>
  );
}

// Hook for using SEO in pages
export function useSEO(
  config: SEOConfig,
  structuredData?: Record<string, any> | Array<Record<string, any>>
) {
  return { config, structuredData };
}

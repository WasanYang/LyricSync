import { getTranslations } from 'next-intl/server';
import { HomeClientComponent } from '@/components/page/HomeClientComponent';

// const HomeClientComponent = dynamic(
//   () =>
//     import('@/components/page/HomeClientComponent').then(
//       (mod) => mod.HomeClientComponent
//     ),
//   { ssr: false }
// );

export async function generateMetadata({
  params,
}: {
  params: { lang: string };
}) {
  const lang = params.lang;
  const t = await getTranslations({ locale: lang, namespace: 'welcome' });
  const title = t('title');
  const description = t('descShort');
  return {
    title,
    description,
    keywords: [title, 'LyricSync'],
    openGraph: {
      title,
      description,
      images: [
        {
          url: 'https://lyricsync.app/icons/logo-512.png',
          width: 512,
          height: 512,
          alt: 'LyricSync Logo',
        },
      ],
      siteName: 'LyricSync',
      locale: lang === 'en' ? 'en_US' : 'th_TH',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/icons/logo-512.png'],
      creator: '@lyricsync',
      site: '@lyricsync',
    },
    alternates: {
      canonical:
        lang === 'en' ? 'https://lyricsync.app/en' : 'https://lyricsync.app',
      languages: {
        'th-TH': 'https://lyricsync.app',
        'en-US': 'https://lyricsync.app/en',
      },
    },
  };
}

export default function Home() {
  return (
    <>
      <HomeClientComponent />
    </>
  );
}

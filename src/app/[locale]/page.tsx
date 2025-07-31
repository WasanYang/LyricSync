import { HomeClientComponent } from '@/components/page/HomeClientComponent';

import {
  generateMetadata as generateSEOMetadata,
  pageSEOConfigs,
} from '@/lib/seo';

// Next.js will inject params, including locale, for this route
export async function generateMetadata({
  params,
}: {
  params: { locale: string };
}) {
  const { locale } = await params;
  return generateSEOMetadata(pageSEOConfigs.home(locale || 'th'));
}
export default function Home() {
  return <HomeClientComponent />;
}

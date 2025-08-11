'use client';

import { useParams } from 'next/navigation';
import Link, { LinkProps } from 'next/link';

type LocalsLinkProps = Omit<LinkProps, 'href'> & {
  href: string;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>;

const locales = ['th', 'en'];

export function LocalsLink({ href, children, ...props }: LocalsLinkProps) {
  const params = useParams();
  const currentLocale =
    typeof params?.locale === 'string' ? params.locale : 'th';

  let url = href;
  const hasLocale = locales.some(
    (locale) => url.startsWith(`/${locale}/`) || url === `/${locale}`
  );

  if (!hasLocale) {
    url = `/${currentLocale}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  return (
    <Link href={url} {...props}>
      {children}
    </Link>
  );
}

export default LocalsLink;

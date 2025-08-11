import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';
import { NextRequest, NextResponse } from 'next/server';

const locales = ['th', 'en']; // กำหนด locale ที่รองรับ
const defaultLocale = 'th';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  let currentLocale =
    request.cookies.get('NEXT_LOCALE')?.value ||
    request.headers.get('accept-language')?.split(',')[0]?.split('-')[0] ||
    defaultLocale;

  if (!locales.includes(currentLocale)) {
    currentLocale = defaultLocale;
  }

  const hasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  );

  if (
    !hasLocale &&
    !pathname.startsWith('/api') &&
    !pathname.startsWith('/_next') &&
    !pathname.includes('.')
  ) {
    // redirect ไป /[defaultLocale]/...
    const url = request.nextUrl.clone();
    url.pathname = `/${defaultLocale}${pathname}`;
    return NextResponse.redirect(url);
  }

  // ให้ next-intl จัดการต่อ
  return createMiddleware(routing)(request);
}

export const config = {
  matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)',
};

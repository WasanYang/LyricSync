import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['th', 'en'],
  defaultLocale: 'th',
  pathnames: {
    '/': '/',
    '/pathnames': {
      th: '/pathnames',
    },
  },
});

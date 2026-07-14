import {defineRouting} from 'next-intl/routing';
import {createNavigation} from 'next-intl/navigation';

export const routing = defineRouting({
  locales: ['fr', 'en', 'ar', 'ru'],
  defaultLocale: 'fr',
  localePrefix: 'as-needed' // Only /en will have a prefix, /fr will be at /
});

export const {Link, redirect, usePathname, useRouter} = createNavigation(routing);

import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './i18n/request';
import { NextRequest } from 'next/server';

// Create internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always' // Change to 'always' to ensure locale is always in URL
});

// Export the middleware function
export default function middleware(request: NextRequest) {
  return intlMiddleware(request);
}

// Configure matcher to apply middleware to all routes except those starting with /api, /_next, etc.
export const config = {
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};
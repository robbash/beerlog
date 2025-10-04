import createMiddleware from 'next-intl/middleware';

export default createMiddleware({ locales: ['en', 'de'], defaultLocale: 'en' });

export const config = {
  matcher: ['/((?!_next|.well-known|favicon.ico|.*\\.png|assets|api).*)'],
};

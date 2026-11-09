import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

// `proxy.ts` is the Next.js 16+ filename for what used to be `middleware.ts`.
// The import path stays `next-intl/middleware` — next-intl did not rename it.
export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!_next|.well-known|favicon.ico|.*\\.png|assets|api|sounds).*)'],
};

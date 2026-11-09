import createMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';

// Must stay named `middleware.ts` on Next.js 15 — `proxy.ts` is only picked up from Next.js 16 on.
export default createMiddleware(routing);

export const config = {
  matcher: ['/((?!_next|.well-known|favicon.ico|.*\\.png|assets|api|sounds).*)'],
};

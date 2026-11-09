import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Don't let `next dev` generate an AGENTS.md in the project root
  agentRules: false,
  // Hosts allowed to load /_next/* dev resources, e.g. when opening the dev
  // server from another machine on the LAN. Comma-separated, set in .env.
  // Without this the client bundle is blocked, React never hydrates, and
  // forms fall back to a native GET submit.
  allowedDevOrigins: process.env.ALLOWED_DEV_ORIGINS?.split(',')
    .map((o) => o.trim())
    .filter(Boolean),
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);

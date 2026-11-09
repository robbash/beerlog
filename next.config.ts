import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const nextConfig: NextConfig = {
  output: 'standalone',
  // Don't let `next dev` generate an AGENTS.md in the project root
  agentRules: false,
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);

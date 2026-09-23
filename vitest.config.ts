import { defineConfig } from 'vitest/config';
import path from 'path';

const dirname = import.meta.dirname;

export default defineConfig({
  // Point envDir at ./tests (which has no .env) so Vite 8 doesn't auto-load the app's
  // .env file into the test process. Tests don't consume env vars (see tests/setup.ts).
  envDir: path.resolve(dirname, './tests'),
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    include: ['tests/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/lib/**/*.ts'],
      exclude: ['src/lib/server/prisma.ts'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
});

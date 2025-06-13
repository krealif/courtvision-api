import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    sequence: {
      concurrent: false,
    },
    env: {
      NODE_OPTIONS: '--import tsx',
    },
    server: {
      deps: {
        inline: ['@fastify/autoload'],
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

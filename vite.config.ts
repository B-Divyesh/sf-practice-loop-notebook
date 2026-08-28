import { defineConfig } from 'vitest/config';
import { resolve } from 'node:path';

export default defineConfig({
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(process.cwd(), 'index.html'),
        privacy: resolve(process.cwd(), 'privacy/index.html'),
        terms: resolve(process.cwd(), 'terms/index.html'),
        unlock: resolve(process.cwd(), 'unlock/index.html'),
      },
      output: { manualChunks: undefined },
    },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});

import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    target: 'es2022',
    sourcemap: true,
    rollupOptions: { output: { manualChunks: undefined } },
  },
  test: {
    include: ['tests/unit/**/*.test.ts'],
  },
});

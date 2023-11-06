/// <reference types="vitest" />
/// <reference types="vite/client" />

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';


export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  define: {
    global: {},
  },
  optimizeDeps: {
    exclude: ['js-big-decimal'],
  },
  build: {
    outDir: 'build',
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'html'],
      exclude: [
        'node_modules/',
        './tests/vitest.setup.ts',
        'build/**/*',
        'deploy/**/*',
        '.storybook/**/*',
        'public/**/*',
        'src/**/index.ts',
        '.eslintrc.cjs',
        '.eslintrc.js',
        '.prettierrc.js',
        'index.ts',
        'src/vite-env.d.ts'
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    exclude: [
      './.storybook/**/*',
      'src/test/**/*',
      'node_modules/**/*',
      'build/**/*',
    ],
  },
});




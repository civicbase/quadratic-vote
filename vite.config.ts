/// <reference types="vitest" />
/// <reference types="vite/client" />

import { resolve } from 'path'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'quadratic-vote',
      fileName: 'quadratic-vote',
    },
  },
  plugins: [dts()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
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
        'main.ts',
        'src/vite-env.d.ts',
      ],
      all: true,
      lines: 80,
      functions: 80,
      branches: 80,
      statements: 80,
    },
    exclude: ['node_modules/**/*', 'dist/**/*'],
  },
})

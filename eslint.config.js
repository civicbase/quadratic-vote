import js from '@eslint/js'
import typescript from '@typescript-eslint/eslint-plugin'
import typescriptParser from '@typescript-eslint/parser'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import globals from 'globals'

export default [
  {
    ignores: [
      'dist',
      'coverage',
      'storybook-static',
      '.tmp-pack',
      'node_modules',
      '*.config.js',
      '*.config.ts',
      '.eslintrc.*',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.es2020,
      },
    },
    plugins: {
      '@typescript-eslint': typescript,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...typescript.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-undef': 'off', // TypeScript handles this
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    // Storybook files are documentation, not library code. Story modules export
    // config objects alongside components, which is exactly what react-refresh warns about.
    files: [
      'stories/**/*.{ts,tsx}',
      '.storybook/**/*.{ts,tsx}',
      'demo/theme.tsx',
      'demo/Toolbar.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
]

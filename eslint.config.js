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
      // Standalone CRA export for CodeSandbox — not library source.
      'sandbox-demo/**',
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
    /**
     * The React Compiler rules that arrived with eslint-plugin-react-hooks 7
     * describe render. These two modules are deliberately outside it: the
     * animation runs on requestAnimationFrame and writes SVG attributes and
     * refs directly, precisely so a frame costs no React render. Satisfying
     * the rules would mean moving that work back into render, which is the
     * thing the design avoids.
     *
     * Scoped to these files so the rules still apply everywhere else.
     */
    files: ['src/QuadraticVote/LiquidPool.tsx', 'src/QuadraticVote/VoteAnimation.tsx'],
    rules: {
      'react-hooks/refs': 'off',
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
    },
  },
  {
    // Tests capture the hook's value by assigning to a variable in the closure,
    // which is how you read context from outside the component under test.
    files: ['src/test/**/*.{ts,tsx}'],
    rules: {
      'react-hooks/globals': 'off',
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

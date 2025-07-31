import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist', 'server.backup/**', 'scripts/**', 'src/tests/**', 'src/__tests__/**', 'src/utils/performance.js', 'src/utils/performanceTest.js', 'src/utils/renderItemsOptimized.js', 'src/store/**', 'src/strategies/**']),
  {
    files: ['**/*.{js,jsx}'],
    extends: [
      js.configs.recommended,
      reactHooks.configs['recommended-latest'],
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    rules: {
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
      'no-prototype-builtins': 'off',
      'no-useless-escape': 'off',
    },
  },
  {
    files: ['playwright.config.js', 'e2e/**/*.js', 'vite.config.js', 'tailwind.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
      },
    },
  },
])

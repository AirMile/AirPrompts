import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  // Global ignores - apply to all configurations
  {
    ignores: [
      'dist/',
      'node_modules/',
      'playwright-mcp/',
      'server.backup/',
      'Claude-Code-Usage-Monitor/',
      'docs/claude-generated/',
      '.husky/',
      'coverage/',
    ],
  },

  // Browser React code (src/) - main application
  {
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': [
        'error',
        {
          varsIgnorePattern:
            '^[A-Z_]|isInitialLoading|isFetching|type|useCallback|variables|context|Component|baseDuration|startTime|commitTime|results',
        },
      ],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Jest test files
  {
    files: [
      'src/**/*.test.{js,jsx}',
      'src/tests/**/*.{js,jsx}',
      'src/__tests__/**/*.{js,jsx}',
      'src/**/test-*.{js,jsx}',
      'src/**/*.spec.{js,jsx}',
    ],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        global: 'writable', // Jest global object
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': [
        'error',
        { varsIgnorePattern: '^[A-Z_]|fireEvent|exportData|contentInput|file|key' },
      ],
      'no-control-regex': 'off', // Allow control characters in tests
    },
  },

  // Node.js scripts and config files
  {
    files: [
      'scripts/**/*.js',
      '*.config.js',
      'playwright.config.js',
      'tailwind.config.js',
      'vite.config.js',
      'jest.config.cjs',
      'postcss.config.js',
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        ...globals.browser, // For performance-benchmark.js that uses window/document
      },
      sourceType: 'module',
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]|error|stdout|startTime' }],
    },
  },

  // E2E Playwright tests
  {
    files: ['e2e/**/*.{js,spec.js}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        ...globals.browser,
      },
      sourceType: 'module',
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_|page|context', varsIgnorePattern: '^[A-Z_]|page|context' },
      ],
    },
  },

  // CommonJS files (jest config only)
  {
    files: ['jest.config.cjs'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        global: 'writable',
        module: 'writable',
      },
      sourceType: 'commonjs',
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },

  // Test setup files
  {
    files: ['src/tests/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.jest,
        global: 'writable',
        process: 'writable',
        jest: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        afterEach: 'readonly',
        Headers: 'readonly',
        Blob: 'readonly',
      },
      sourceType: 'module',
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]' }],
    },
  },

  // Legacy/problematic files - more relaxed rules
  {
    files: [
      'src/services/storage/LegacyDataAdapter.js',
      'src/services/storage/StorageFacade.js',
      'src/utils/performance.js',
      'src/services/monitoring/**/*.js',
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
        process: 'readonly',
        React: 'readonly',
        useEffect: 'readonly',
      },
      sourceType: 'module',
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '^[A-Z_]|error|React|useEffect|process' }],
      'no-undef': 'off', // Disable for legacy files with parsing issues
    },
  },
];

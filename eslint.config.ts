import js from '@eslint/js';
import prettier from 'eslint-config-prettier';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const PURE_LAYER_MESSAGE =
  'domain/ y layout/ son TypeScript puro: no pueden depender de React, three, R3F ni de capas superiores.';

const pureLayerPatterns = [
  { group: ['react', 'react/**', 'react-dom', 'react-dom/**'], message: PURE_LAYER_MESSAGE },
  {
    group: ['three', 'three/**', '@react-three/**', 'postprocessing'],
    message: PURE_LAYER_MESSAGE,
  },
  { group: ['gsap', 'gsap/**', 'zustand', 'zustand/**'], message: PURE_LAYER_MESSAGE },
  {
    group: [
      '@/scene',
      '@/scene/**',
      '@/ui',
      '@/ui/**',
      '@/state',
      '@/state/**',
      '@/app',
      '@/app/**',
      '@/hooks',
      '@/hooks/**',
      '@/animation',
      '@/animation/**',
      '**/scene/**',
      '**/ui/**',
      '**/state/**',
      '**/app/**',
      '**/hooks/**',
      '**/animation/**',
    ],
    message: PURE_LAYER_MESSAGE,
  },
];

export default defineConfig([
  globalIgnores(['dist', 'node_modules', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      tseslint.configs.stylisticTypeChecked,
    ],
    languageOptions: {
      ecmaVersion: 2023,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat['recommended-latest'], reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['scripts/**/*.ts', '*.config.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/domain/**/*.ts', 'src/layout/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', { patterns: pureLayerPatterns }],
    },
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            ...pureLayerPatterns,
            {
              group: [
                '@/layout',
                '@/layout/**',
                '**/layout/**',
                '@/data',
                '@/data/**',
                '**/data/**',
              ],
              message: 'domain/ es la base: no puede depender de layout/ ni de data/.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/scene/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/ui', '@/ui/**', '**/ui/**'],
              message: 'scene/ y ui/ se comunican solo a través de state/.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['src/ui/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/scene', '@/scene/**', '**/scene/**'],
              message: 'scene/ y ui/ se comunican solo a través de state/.',
            },
          ],
        },
      ],
    },
  },
  prettier,
]);

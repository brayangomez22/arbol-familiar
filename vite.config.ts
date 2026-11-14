import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';
import { dataSetFrom, familyData } from './tooling/familyData';

/**
 * Libraries that change far less often than the app: their own files, cached across deploys.
 * drei and three-stdlib stay out: much of them only serves the lazy developer view.
 */
const VENDOR_GROUPS = [
  { name: 'three', test: /node_modules[\\/]\.pnpm[\\/]three@/ },
  {
    name: 'react',
    test: /node_modules[\\/]\.pnpm[\\/](react|react-dom|scheduler)@/,
  },
  {
    name: 'r3f',
    test: /node_modules[\\/]\.pnpm[\\/](@react-three\+fiber|camera-controls|troika|bidi-js|webgl-sdf-generator|maath|its-fine|zustand|suspend-react)/,
  },
];

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  // Where the site lives: "/" for its own domain, "/arbol-familiar/" for GitHub Pages.
  const base = env.VITE_BASE ?? '/';
  return {
    base,
    plugins: [react(), familyData(dataSetFrom(env.VITE_DATA), env.VITE_SITE_URL)],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    build: {
      // three is one vendor chunk of ~750 kB (190 kB gzip): R3F imports its whole namespace, so it
      // cannot be tree-shaken. It is cached across deploys; the warning would only be noise.
      chunkSizeWarningLimit: 800,
      rolldownOptions: {
        output: { codeSplitting: { groups: VENDOR_GROUPS } },
      },
    },
    test: {
      include: ['src/**/*.test.ts', 'scripts/**/*.test.ts', 'tooling/**/*.test.ts'],
      environment: 'node',
    },
  };
});

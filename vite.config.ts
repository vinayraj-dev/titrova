import { defineConfig } from 'vitest/config';
import type { Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { fileURLToPath } from 'node:url';

// `--mode singlefile` produces one self-contained HTML file (used for shareable previews).
/** The single-file preview has no server, so links to /favicon.svg and the manifest are removed from it. */
const stripRootLinks = (): Plugin => ({
  name: 'strip-root-links',
  transformIndexHtml: (html) =>
    html
      .replace(/\s*<link rel="(icon|apple-touch-icon|manifest)"[^>]*>/g, '')
      .replace('<!--app-head-->', '<title>Titrova – Free Salesforce Developer Tools</title>'),
});

export default defineConfig(({ mode }) => ({
  plugins: [react(), ...(mode === 'singlefile' ? [viteSingleFile(), stripRootLinks()] : [])],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  build: {
    target: 'es2020',
    assetsInlineLimit: mode === 'singlefile' ? 100_000_000 : 4096,
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
}));

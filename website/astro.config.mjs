// GPX Viewer website. Author: A097MPRUS.
// Canonical links always name the one official address, https://gpxviewerpro.pages.dev/
// (Cloudflare Pages); SITE_URL overrides it only for local experiments.
import { defineConfig } from 'astro/config';

const site = process.env.SITE_URL || 'https://gpxviewerpro.pages.dev';
const base = process.env.SITE_BASE || '/';

export default defineConfig({
  site,
  base,
  output: 'static',
  trailingSlash: 'ignore',
  compressHTML: true,
  build: { format: 'directory', assets: 'assets' },
  devToolbar: { enabled: false },
  vite: {
    build: { sourcemap: false },
    worker: { format: 'es' },
  },
});

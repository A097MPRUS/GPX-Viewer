// GPX Viewer website. Author: A097MPRUS.
// The public address is never hard-coded: SITE_URL and SITE_BASE come from the deployment
// workflow (actions/configure-pages) and default to a local preview.
import { defineConfig } from 'astro/config';

const site = process.env.SITE_URL || 'http://localhost:4321';
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

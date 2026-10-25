// Adds the preview-only header to dist/_headers. Author: A097MPRUS.
// Preview builds (anything but PUBLIC_SITE_STAGE=public) ask search engines not to index any page;
// the public production build leaves indexing to robots.txt and the page metadata.
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const file = fileURLToPath(new URL('../dist/_headers', import.meta.url));
if (process.env.PUBLIC_SITE_STAGE !== 'public') {
  const text = readFileSync(file, 'utf8');
  if (!/^\s+X-Robots-Tag:/m.test(text)) {
    writeFileSync(file, text.replace(/^\/\*\n/m, '/*\n  X-Robots-Tag: noindex, nofollow\n'));
  }
}

// Checks the built site in dist/. Author: A097MPRUS.
// - Every internal link, image, script and stylesheet resolves to a built file (respecting the
//   configured base path, as on GitHub Pages).
// - Only allowlisted external hosts appear: no analytics, tracking or font services, and no host
//   that could receive GPX data.
// - Web Lite code contains no network call other than fetching the bundled sample and the worker.
// - Preview builds carry noindex; public builds do not.
// - Visible text contains no em or en dashes.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../dist/', import.meta.url));
const base = (process.env.SITE_BASE || '/').replace(/\/?$/, '/');
const stage = process.env.PUBLIC_SITE_STAGE === 'public' ? 'public' : 'preview';
const errors = [];
const fail = (m) => errors.push(m);

const ALLOWED_HOSTS = new Set([
  'sourceforge.net',
  'tile.openstreetmap.org',
  'www.openstreetmap.org',
  'openstreetmap.org',
  'tile.opentopomap.org',
  'opentopomap.org',
  'creativecommons.org',
  'opendatacommons.org',
  'leafletjs.com',
  'github.com',
  'localhost',
  'operations.osmfoundation.org',
]);
// The site's own public address (canonical and preview image links).
if (process.env.SITE_URL) ALLOWED_HOSTS.add(new URL(process.env.SITE_URL).hostname);
const FORBIDDEN = [
  'google-analytics',
  'googletagmanager',
  'fonts.googleapis',
  'fonts.gstatic',
  'doubleclick.net',
  'plausible.io',
  'segment.io',
  'hotjar',
  'clarity.ms',
  'sentry.io',
  'facebook.net',
  'apple.com',
];

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
}
const files = walk(dist);
const html = files.filter((f) => f.endsWith('.html'));
const js = files.filter((f) => f.endsWith('.js'));

function resolveInternal(ref, fromFile) {
  let path = ref.split('#')[0].split('?')[0];
  if (!path) return true;
  if (path.startsWith('/')) {
    if (!path.startsWith(base)) return false;
    path = path.slice(base.length);
  } else {
    path = relative(dist, join(fromFile, '..', path));
  }
  const target = join(dist, decodeURIComponent(path));
  return existsSync(target) && statSync(target).isFile()
    ? true
    : existsSync(join(target, 'index.html'));
}

for (const file of html) {
  const text = readFileSync(file, 'utf8');
  const name = relative(dist, file);
  for (const m of text.matchAll(/\s(?:href|src|srcset|content)="([^"]+)"/g)) {
    for (const part of m[1].split(',')) {
      const ref = part.trim().split(/\s+/)[0];
      if (!ref || ref.startsWith('#') || ref.startsWith('data:') || ref.startsWith('mailto:'))
        continue;
      if (/^https?:\/\//.test(ref)) {
        const host = new URL(ref).hostname;
        if (!ALLOWED_HOSTS.has(host) && !host.endsWith('.sourceforge.net'))
          fail(`${name}: external host ${host}`);
        continue;
      }
      if (m[0].includes('content=')) continue;
      if (!resolveInternal(ref, file)) fail(`${name}: broken internal reference ${ref}`);
    }
  }
  const noindex = text.includes('name="robots" content="noindex, nofollow"');
  if (stage === 'preview' && !noindex) fail(`${name}: preview build without noindex`);
  if (stage === 'public' && noindex) fail(`${name}: public build still carries noindex`);
  const visible = text
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<[^>]+>/g, ' ');
  if (/[–—]/.test(visible)) fail(`${name}: em or en dash in visible text`);
}

for (const file of [...html, ...js]) {
  const text = readFileSync(file, 'utf8').toLowerCase();
  for (const f of FORBIDDEN)
    if (text.includes(f)) fail(`${relative(dist, file)}: forbidden reference ${f}`);
}
for (const file of js) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(/\b(sendBeacon|XMLHttpRequest|WebSocket|EventSource)\b/g))
    fail(`${relative(dist, file)}: unexpected network API ${m[1]}`);
  for (const m of text.matchAll(/https?:\/\/([a-z0-9.-]+)/gi)) {
    const host = m[1].toLowerCase().replace(/^\{s\}\./, '');
    if (host.includes('{')) continue;
    if (!ALLOWED_HOSTS.has(host) && !host.endsWith('.sourceforge.net') && !host.endsWith('w3.org'))
      fail(`${relative(dist, file)}: external host in script ${host}`);
  }
}
for (const required of [
  'index.html',
  'viewer/index.html',
  'downloads/index.html',
  'explore/index.html',
  'docs/index.html',
  'legal/index.html',
  'privacy/index.html',
  'changelog/index.html',
  '404.html',
  'samples/gpx-viewer-sample-mullerthal.gpx',
])
  if (!existsSync(join(dist, required))) fail(`missing ${required}`);

if (errors.length) {
  console.error(
    `Built site check failed (${errors.length}):\n- ${[...new Set(errors)].join('\n- ')}`,
  );
  process.exit(1);
}
console.log(
  `Built site valid: ${html.length} pages, ${js.length} scripts, base ${base}, ${stage} build.`,
);

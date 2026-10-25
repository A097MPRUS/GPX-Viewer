// Validates this repository: generated files up to date, relative links and images resolve,
// manifest download links point to SourceForge, no em or en dashes. Author: A097MPRUS.
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const errors = [];
execFileSync(process.execPath, [join(root, 'scripts/generate.mjs'), '--check'], { stdio: 'inherit' });

const walk = (dir) =>
  readdirSync(dir).flatMap((n) => {
    if (n === '.git' || n === 'node_modules') return [];
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const files = walk(root);
for (const file of files.filter((f) => f.endsWith('.md'))) {
  const text = readFileSync(file, 'utf8');
  const name = relative(root, file);
  for (const m of text.matchAll(/(?:\]\(|src=")([^)"#\s]+)(#[^)"]*)?[)"]/g)) {
    const ref = m[1];
    if (/^(https?:|mailto:)/.test(ref)) continue;
    if (!existsSync(join(dirname(file), decodeURI(ref)))) errors.push(`${name}: broken link ${ref}`);
  }
  if (/[–—]/.test(text) && !['LEGAL_NOTICE.md', 'PRIVACY.md', 'THIRD_PARTY.md'].includes(name))
    errors.push(`${name}: em or en dash`);
}
const manifest = JSON.parse(readFileSync(join(root, 'release/release-manifest.json'), 'utf8'));
for (const r of manifest.releases)
  for (const a of r.assets) {
    if (!a.url.startsWith('https://sourceforge.net/projects/gpx-viewer/files/')) errors.push(`${a.id}: not a SourceForge link`);
    if (!/^[0-9a-f]{64}$/.test(a.sha256)) errors.push(`${a.id}: SHA-256`);
  }
if (errors.length) {
  console.error(`Validation failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`Repository valid: ${files.filter((f) => f.endsWith('.md')).length} Markdown files checked.`);

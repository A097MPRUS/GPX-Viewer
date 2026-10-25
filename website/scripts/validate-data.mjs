// Validates the synced public metadata before a build. Author: A097MPRUS.
// Fails on: missing or malformed fields, impossible versions or dates, download URLs that are not
// SourceForge download links, checksums that are not SHA-256, platform references to unknown
// platforms, a Windows asset that is not an .exe or a macOS asset that is not a .pkg, .dmg or .zip,
// download buttons for platforms that are not released, screenshots marked available without a
// file, and text with em or en dashes.
import { existsSync, readFileSync } from 'node:fs';

const read = (p) => JSON.parse(readFileSync(new URL(`../${p}`, import.meta.url), 'utf8'));
const errors = [];
const fail = (m) => errors.push(m);

const manifest = read('src/data/release-manifest.json');
const features = read('src/data/features.json');
const shots = read('src/data/screenshots.json');

const platformIds = new Set(manifest.platforms.map((p) => p.id));
const released = new Set(
  manifest.platforms.filter((p) => p.status === 'released').map((p) => p.id),
);
const statuses = new Set(['released', 'in-development', 'not-released', 'on-hold']);
for (const p of manifest.platforms) {
  if (!statuses.has(p.status)) fail(`platform ${p.id}: unknown status ${p.status}`);
  if (p.status === 'released' && !p.current)
    fail(`platform ${p.id}: released without a current version`);
  if (p.status !== 'released' && p.current)
    fail(`platform ${p.id}: not released but has a current version`);
}
const seenCurrent = new Set();
for (const r of manifest.releases) {
  const where = `release ${r.id}`;
  if (!/^\d+\.\d+\.\d+$/.test(r.version)) fail(`${where}: version ${r.version}`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(r.date) || Number.isNaN(Date.parse(r.date)))
    fail(`${where}: date ${r.date}`);
  if (!['current', 'archived', 'upcoming'].includes(r.status)) fail(`${where}: status ${r.status}`);
  if (r.status === 'upcoming') {
    // Nothing of a release in preparation may look downloadable.
    if (r.assets?.length) fail(`${where}: an upcoming release must not list downloads`);
    if (r.folder || r.checksums || r.github)
      fail(`${where}: an upcoming release must not link files`);
    const current = manifest.releases.find((o) => o.family === r.family && o.status === 'current');
    const v = (x) =>
      x
        .split('.')
        .map(Number)
        .reduce((a, n) => a * 1000 + n, 0);
    if (current && v(r.version) <= v(current.version))
      fail(`${where}: not newer than the current ${current.version}`);
  }
  for (const f of r.screenshots ?? [])
    if (!existsSync(new URL(`../src/assets/screenshots/${f}`, import.meta.url)))
      fail(`${where}: screenshot ${f} missing`);
  if (r.github && !r.github.startsWith('https://github.com/A097MPRUS/GPX-Viewer/releases/'))
    fail(`${where}: GitHub link is not a GPX-Viewer release`);
  if (r.status === 'current') {
    if (seenCurrent.has(r.family)) fail(`${where}: two current releases for ${r.family}`);
    seenCurrent.add(r.family);
  }
  if (r.status !== 'upcoming' && !r.assets?.length) fail(`${where}: no assets`);
  for (const a of r.assets ?? []) {
    const at = `${where} asset ${a.id}`;
    if (a.platform !== 'source' && !platformIds.has(a.platform))
      fail(`${at}: unknown platform ${a.platform}`);
    if (a.platform !== 'source' && r.status === 'current' && !released.has(a.platform))
      fail(`${at}: download for a platform that is not released`);
    if (!/^[0-9a-f]{64}$/.test(a.sha256)) fail(`${at}: SHA-256 is not 64 hex digits`);
    if (!(Number.isInteger(a.size) && a.size > 0)) fail(`${at}: size`);
    if (
      !a.url.startsWith('https://sourceforge.net/projects/gpx-viewer/files/') ||
      !a.url.endsWith('/download')
    )
      fail(`${at}: URL is not a GPX Viewer SourceForge download link`);
    const expectedPath = encodeURI(a.path).replace(/\+/g, '%2B');
    if (!a.url.includes(expectedPath)) fail(`${at}: URL does not match the file path`);
    if (!a.path.endsWith(a.file)) fail(`${at}: path and file name differ`);
    if (a.platform.startsWith('windows') && a.format !== 'exe')
      fail(`${at}: Windows asset is not an installer`);
    if (a.platform.startsWith('macos') && !['pkg', 'dmg'].includes(a.format))
      fail(`${at}: macOS asset format ${a.format}`);
    if (a.platform.startsWith('macos') && r.family !== 'macos')
      fail(`${at}: macOS asset in a ${r.family} release`);
    if (a.platform.startsWith('windows') && r.family !== 'windows')
      fail(`${at}: Windows asset in a ${r.family} release`);
  }
}
for (const fam of ['macos', 'windows'])
  if (!seenCurrent.has(fam)) fail(`no current ${fam} release`);

const editions = new Set(features.editions.map((e) => e.id));
const fstatus = new Set(['yes', 'partial', 'no', 'unverified']);
for (const c of features.categories)
  for (const f of c.features) {
    for (const e of editions)
      if (!fstatus.has(f.status?.[e])) fail(`feature ${f.id}: status for ${e}`);
    for (const k of Object.keys(f.note ?? {}))
      if (!editions.has(k)) fail(`feature ${f.id}: note for unknown edition ${k}`);
  }

for (const s of shots.items) {
  const file = new URL(`../src/assets/screenshots/${s.file}`, import.meta.url);
  if (s.status === 'available' && !existsSync(file))
    fail(`screenshot ${s.file}: marked available but missing`);
  if (!s.alt || !s.caption) fail(`screenshot ${s.file}: caption and alt text are required`);
}

const dash = /[–—]/;
for (const [name, obj] of [
  ['release-manifest.json', manifest],
  ['features.json', features],
  ['screenshots.json', shots],
])
  if (dash.test(JSON.stringify(obj))) fail(`${name}: contains an em or en dash`);

if (errors.length) {
  console.error(`Metadata check failed:\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(
  `Metadata valid: ${manifest.releases.length} releases, ${manifest.platforms.length} platforms, ${shots.items.length} screenshot entries.`,
);

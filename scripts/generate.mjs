// Generates the release-dependent parts of this repository from release/release-manifest.json
// and release/features.json. Author: A097MPRUS.
//
//   node scripts/generate.mjs           write README.md sections, CHANGELOG.md, docs/FEATURES.md
//   node scripts/generate.mjs --check   exit 1 when any of them is out of date
//
// README.md keeps hand-written text; only the blocks between <!-- name:start --> and
// <!-- name:end --> markers are replaced.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');
const manifest = JSON.parse(read('release/release-manifest.json'));
const features = JSON.parse(read('release/features.json'));
const check = process.argv.includes('--check');

const mb = (n) => `${(n / 1e6).toFixed(1)} MB`; // decimal, as SourceForge shows
const fam = (f) => (f === 'macos' ? 'macOS' : 'Windows');
const date = (iso) =>
  new Date(`${iso}T12:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const platform = (id) => manifest.platforms.find((p) => p.id === id);

function downloads() {
  const rows = [];
  for (const r of manifest.releases.filter((r) => r.status === 'current'))
    for (const a of r.assets.filter((a) => a.kind === 'installer')) {
      const p = platform(a.platform);
      rows.push(`| ${p.name} | ${p.requirements} | [${a.file}](${a.url}) | ${mb(a.size)} | \`${a.sha256}\` |`);
    }
  return [
    '| Edition | Requirements | Installer | Size | SHA-256 |',
    '| --- | --- | --- | --- | --- |',
    ...rows,
    '',
    `Released: macOS ${manifest.releases.find((r) => r.family === 'macos' && r.status === 'current').version} on ${date(manifest.releases.find((r) => r.family === 'macos' && r.status === 'current').date)}, Windows ${manifest.releases.find((r) => r.family === 'windows' && r.status === 'current').version} on ${date(manifest.releases.find((r) => r.family === 'windows' && r.status === 'current').date)}. Files are hosted on [SourceForge](${manifest.product.sourceforgeFiles}). Archived releases are listed in [CHANGELOG.md](CHANGELOG.md).`,
  ].join('\n');
}

function platforms() {
  const label = { released: 'Released', 'in-development': 'In development, no public release', 'not-released': 'No public build', 'on-hold': 'On hold' };
  return [
    '| Platform | Status | Current version | Architecture |',
    '| --- | --- | --- | --- |',
    ...manifest.platforms.map((p) => `| ${p.name} | ${label[p.status]} | ${p.current ?? ''} | ${p.architecture ?? ''} |`),
  ].join('\n');
}

function limitations() {
  const r = manifest.releases.find((r) => r.family === 'macos' && r.status === 'current');
  const w = manifest.releases.find((r) => r.family === 'windows' && r.status === 'current');
  const of = (x) => (x.sections?.limitations?.length ? x.sections.limitations : x.limitations);
  return [...of(r), ...of(w)].map((l) => `- ${l}`).join('\n');
}

const SECTIONS = [
  ['new', 'New features'],
  ['improvements', 'Improvements'],
  ['fixes', 'Bug fixes'],
  ['performance', 'Performance'],
  ['compatibility', 'Compatibility'],
  ['privacy', 'Privacy and legal information'],
  ['limitations', 'Known limitations'],
];

function changelog() {
  const out = ['# Changelog', '', 'Published releases of GPX Viewer. Generated from `release/release-manifest.json`; releases in preparation are not listed.', ''];
  const sorted = manifest.releases
    .filter((r) => r.status !== 'upcoming')
    .sort((a, b) => b.date.localeCompare(a.date) || a.family.localeCompare(b.family));
  for (const r of sorted) {
    out.push(`## ${fam(r.family)} ${r.version}${r.build ? ` (build ${r.build})` : ''}${r.title ? `: ${r.title}` : ''}, ${date(r.date)}${r.status === 'archived' ? ' (archived)' : ''}`, '');
    out.push(r.summary, '');
    if (r.sections) {
      for (const [key, title] of SECTIONS)
        if (r.sections[key]?.length) out.push(`### ${title}`, '', ...r.sections[key].map((c) => `- ${c}`), '');
    } else {
      if (r.changes.length) out.push(...r.changes.map((c) => `- ${c}`), '');
      if (r.limitations.length) out.push('Known limitations:', '', ...r.limitations.map((c) => `- ${c}`), '');
    }
    if (r.attribution) out.push(r.attribution, '');
    out.push('| File | Size | SHA-256 |', '| --- | --- | --- |');
    for (const a of r.assets) out.push(`| [${a.file}](${a.url})${a.github ? ` ([GitHub](${a.github}))` : ''} | ${mb(a.size)} | \`${a.sha256}\` |`);
    out.push('');
    if (r.github) out.push(`GitHub Release: ${r.github}`, '');
    if (r.hiddenUntil) out.push(`The files of this release are temporarily hidden on SourceForge until ${date(r.hiddenUntil.slice(0, 10))}.`, '');
  }
  return out.join('\n');
}

function featureDoc() {
  const text = { yes: 'Yes', partial: 'Partly', no: 'No', unverified: 'Not verified' };
  const pending = (v) => v && manifest.releases.some((r) => r.version === v && r.family === 'macos' && r.status === 'upcoming');
  const eds = features.editions;
  const out = [
    '# Features by edition',
    '',
    'Generated from `release/features.json`. "Not verified" means the feature exists on macOS but the Windows edition has not been re-checked for it since the 2 October 2026 reference copy.',
    '',
  ];
  let n = 0;
  const notes = [];
  for (const c of features.categories) {
    out.push(`## ${c.title}`, '');
    if (pending(c.release)) out.push(`In GPX Viewer ${c.release} for macOS, which is being prepared and not published yet.`, '');
    out.push(`| Feature | ${eds.map((e) => e.name).join(' | ')} |`, `| --- | ${eds.map(() => '---').join(' | ')} |`);
    for (const f of c.features) {
      const cells = eds.map((e) => {
        const note = f.note?.[e.id];
        if (!note) return text[f.status[e.id]];
        n += 1;
        notes.push(`${n}. ${f.title}, ${e.name}: ${note}`);
        return `${text[f.status[e.id]]} (${n})`;
      });
      out.push(`| **${f.title}**${f.detail ? `<br>${f.detail}` : ''} | ${cells.join(' | ')} |`);
    }
    out.push('');
  }
  out.push('## Notes', '', ...notes, '', '## Sources', '', ...eds.map((e) => `- ${e.name}: ${features.sources[e.id]}`), '');
  return out.join('\n');
}

const outputs = new Map();
let readme = read('README.md');
for (const [name, body] of [
  ['downloads', downloads()],
  ['platforms', platforms()],
  ['limitations', limitations()],
]) {
  const re = new RegExp(`(<!-- ${name}:start -->)[\\s\\S]*?(<!-- ${name}:end -->)`);
  if (!re.test(readme)) throw new Error(`README.md lacks the ${name} markers`);
  readme = readme.replace(re, `$1\n${body}\n$2`);
}
outputs.set('README.md', readme);
outputs.set('CHANGELOG.md', changelog());
outputs.set('docs/FEATURES.md', featureDoc());

let stale = 0;
for (const [path, content] of outputs) {
  const url = new URL(path, root);
  const current = existsSync(url) ? readFileSync(url, 'utf8') : '';
  if (current === content) continue;
  if (check) {
    console.error(`${path} is out of date; run node scripts/generate.mjs`);
    stale++;
  } else writeFileSync(url, content);
}
if (check && stale) process.exit(1);
console.log(check ? 'Generated files are up to date.' : 'Generated README.md sections, CHANGELOG.md and docs/FEATURES.md.');

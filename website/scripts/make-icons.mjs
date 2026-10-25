// Generates favicons, web app icons and the social preview image from the application icon
// (src/assets/icon-1024.png: the 1024 px export of the owner's Icon Composer icon, synced from
// Setup/public). Every size is reduced from the 1024 px original with a high-quality filter; the
// artwork itself is never altered, redrawn or enlarged. Author: A097MPRUS.
import sharp from 'sharp';
import { Buffer } from 'node:buffer';
import { mkdir, writeFile } from 'node:fs/promises';

const icon = 'src/assets/icon-1024.png';
const meta = await sharp(icon).metadata();
if ((meta.width ?? 0) < 1024 || (meta.height ?? 0) < 1024) {
  throw new Error(`${icon} must be at least 1024 px; never enlarge a smaller icon`);
}
await mkdir('public', { recursive: true });
const sizes = [
  ['favicon-32.png', 32],
  ['favicon-48.png', 48],
  ['apple-touch-icon.png', 180],
  ['icon-192.png', 192],
  ['icon-512.png', 512],
];
for (const [name, size] of sizes) {
  await sharp(icon)
    .resize(size, size, { kernel: 'lanczos3' })
    .png({ compressionLevel: 9 })
    .toFile(`public/${name}`);
}
await writeFile(
  'public/site.webmanifest',
  JSON.stringify(
    {
      name: 'GPX Viewer',
      short_name: 'GPX Viewer',
      icons: [
        { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
        { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
      ],
      theme_color: '#16171a',
      background_color: '#ffffff',
      display: 'browser',
    },
    null,
    2,
  ) + '\n',
);

const W = 1200;
const H = 630;
const iconPng = await sharp(icon).resize(260, 260, { kernel: 'lanczos3' }).png().toBuffer();
const text = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f3f3f1"/>
  <text x="430" y="300" font-family="IBM Plex Sans, Helvetica Neue, Arial, sans-serif" font-size="84" font-weight="600" fill="#16171a">GPX Viewer</text>
  <text x="432" y="362" font-family="IBM Plex Sans, Helvetica Neue, Arial, sans-serif" font-size="30" fill="#5d6169">View, analyse and edit GPS tracks</text>
</svg>`);
await sharp(text)
  .composite([{ input: iconPng, left: 120, top: 185 }])
  .png()
  .toFile('public/og-image.png');
console.log(
  `${sizes.map(([n]) => 'public/' + n).join(', ')}, public/site.webmanifest, public/og-image.png`,
);

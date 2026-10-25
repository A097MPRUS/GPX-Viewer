// Generates favicons and the social preview image from the application icon (src/assets/
// icon-1024.png, synced from Setup/public). The artwork itself is never altered. Author: A097MPRUS.
import sharp from 'sharp';
import { Buffer } from 'node:buffer';
import { mkdir } from 'node:fs/promises';

const icon = 'src/assets/icon-1024.png';
await mkdir('public', { recursive: true });
await sharp(icon).resize(64, 64).png().toFile('public/favicon-64.png');
await sharp(icon).resize(180, 180).png().toFile('public/apple-touch-icon.png');

const W = 1200;
const H = 630;
const iconPng = await sharp(icon).resize(260, 260).png().toBuffer();
const text = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <rect width="100%" height="100%" fill="#f3f3f1"/>
  <text x="430" y="300" font-family="IBM Plex Sans, Helvetica Neue, Arial, sans-serif" font-size="84" font-weight="600" fill="#16171a">GPX Viewer</text>
  <text x="432" y="362" font-family="IBM Plex Sans, Helvetica Neue, Arial, sans-serif" font-size="30" fill="#5d6169">View, analyse and edit GPS tracks</text>
</svg>`);
await sharp(text)
  .composite([{ input: iconPng, left: 120, top: 185 }])
  .png()
  .toFile('public/og-image.png');
console.log('public/favicon-64.png, public/apple-touch-icon.png, public/og-image.png');

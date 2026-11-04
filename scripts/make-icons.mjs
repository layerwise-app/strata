#!/usr/bin/env node
// Regenerates every icon from public/logo.svg:
//
//   pnpm icons
//
// Writes public/logo.png (1024 × 1024), favicon.svg, favicon.ico (16, 32, 48),
// favicon.png, favicon-16x16.png, favicon-32x32.png, apple-touch-icon.png,
// android-chrome-192x192.png and android-chrome-512x512.png, and refreshes
// site.webmanifest from src/site.config.ts.
//
// Below 64 px the hatched band in the logo turns to noise, so the small icons
// use a variant with that band filled flat. A logo without the hatch is used
// as it is at every size.

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { siteConfig } from '../src/site.config.ts';

const root = new URL('..', import.meta.url);
const path = (p) => fileURLToPath(new URL(p, root));

const svg = await readFile(path('public/logo.svg'), 'utf8');
const small = svg.replace(
  /fill="url\(#h\)"[^/]*\/>/,
  `fill="${siteConfig.colors.paper}" fill-opacity="0.55"/>`
);

async function png(source, size) {
  return sharp(Buffer.from(source), { density: (72 * size) / 64 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toBuffer();
}

const outputs = [
  ['logo.png', svg, 1024],
  ['android-chrome-512x512.png', svg, 512],
  ['android-chrome-192x192.png', svg, 192],
  ['apple-touch-icon.png', svg, 180],
  ['favicon.png', small, 32],
  ['favicon-32x32.png', small, 32],
  ['favicon-16x16.png', small, 16]
];
for (const [file, source, size] of outputs) {
  await writeFile(path(`public/${file}`), await png(source, size));
  console.log(`✓ public/${file} (${size}×${size})`);
}

await writeFile(path('public/favicon.svg'), small);
console.log('✓ public/favicon.svg');

// favicon.ico with PNG-encoded 16, 32 and 48 px images.
const sizes = [16, 32, 48];
const images = await Promise.all(sizes.map((s) => png(small, s)));
const header = Buffer.alloc(6 + 16 * sizes.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(sizes.length, 4);
let offset = header.length;
sizes.forEach((size, i) => {
  const entry = 6 + 16 * i;
  header.writeUInt8(size, entry);
  header.writeUInt8(size, entry + 1);
  header.writeUInt8(0, entry + 2);
  header.writeUInt8(0, entry + 3);
  header.writeUInt16LE(1, entry + 4);
  header.writeUInt16LE(32, entry + 6);
  header.writeUInt32LE(images[i].length, entry + 8);
  header.writeUInt32LE(offset, entry + 12);
  offset += images[i].length;
});
await writeFile(path('public/favicon.ico'), Buffer.concat([header, ...images]));
console.log('✓ public/favicon.ico (16, 32, 48)');

const manifest = {
  name: `${siteConfig.product} by ${siteConfig.company}`,
  short_name: siteConfig.product,
  icons: [
    { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
    { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' }
  ],
  theme_color: siteConfig.colors.paper,
  background_color: siteConfig.colors.paper,
  display: 'standalone'
};
await writeFile(path('public/site.webmanifest'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log('✓ public/site.webmanifest');

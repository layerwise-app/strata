#!/usr/bin/env node
// Prepares images for the site.
//
//   pnpm add-images path/to/console.png [more files…] [--name=console-2026]
//
// For each source image it writes WebP versions 800, 1600 and 2880 px wide
// (never wider than the source) to public/images/, measures them, makes a
// tiny blurred placeholder, and records everything in src/content/images.json
// under a key made from the file name (or --name for a single file).
// GIFs are copied untouched so they keep their animation. SVGs are rejected:
// draw vector art as a component instead.

import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const WIDTHS = [800, 1600, 2880];
const root = new URL('..', import.meta.url);
const outDir = fileURLToPath(new URL('public/images/', root));
const manifestPath = fileURLToPath(new URL('src/content/images.json', root));

const args = process.argv.slice(2);
const nameArg = args.find((a) => a.startsWith('--name='))?.slice('--name='.length);
const files = args.filter((a) => !a.startsWith('--'));

if (!files.length) {
  console.error('Usage: pnpm add-images <image> [more images…] [--name=key]');
  process.exit(1);
}
if (nameArg && files.length > 1) {
  console.error('--name works with one image at a time.');
  process.exit(1);
}

await mkdir(outDir, { recursive: true });
const manifest = JSON.parse(await readFile(manifestPath, 'utf8').catch(() => '{}'));
let failed = false;

for (const file of files) {
  const ext = extname(file).toLowerCase();
  const key = nameArg || slug(basename(file, extname(file)));
  try {
    if (ext === '.svg' || ext === '.svgz') {
      throw new Error('SVG is not accepted. Draw vector art as a React component instead.');
    }
    const input = await readFile(file);
    const meta = await sharp(input, { animated: true }).metadata();
    if (meta.format === 'svg') throw new Error('SVG is not accepted.');
    if (!meta.width || !meta.height) throw new Error('Could not read the image size.');
    const height = meta.pageHeight || meta.height;
    const blur = await placeholder(input);

    if (meta.format === 'gif' || ext === '.gif') {
      const name = `${key}.gif`;
      await copyFile(file, `${outDir}${name}`);
      manifest[key] = {
        src: `/images/${name}`,
        width: meta.width,
        height,
        srcset: [{ src: `/images/${name}`, width: meta.width }],
        blur,
        type: 'image/gif'
      };
      console.log(`✓ ${key}: GIF kept as is (${meta.width}×${height})`);
      continue;
    }

    const widths = WIDTHS.filter((w) => w <= meta.width);
    if (!widths.length) widths.push(meta.width);
    const srcset = [];
    for (const w of widths) {
      const name = `${key}-${w}.webp`;
      await sharp(input).rotate().resize({ width: w }).webp({ quality: 82 }).toFile(`${outDir}${name}`);
      srcset.push({ src: `/images/${name}`, width: w });
    }
    const largest = srcset.at(-1);
    const info = await sharp(`${outDir}${basename(largest.src)}`).metadata();
    manifest[key] = {
      src: largest.src,
      width: info.width,
      height: info.height,
      srcset,
      blur,
      type: 'image/webp'
    };
    console.log(`✓ ${key}: ${widths.join(', ')} px WebP (${info.width}×${info.height})`);
  } catch (error) {
    failed = true;
    console.error(`✗ ${file}: ${error.message}`);
  }
}

const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
await writeFile(manifestPath, `${JSON.stringify(sorted, null, 2)}\n`);
process.exit(failed ? 1 : 0);

async function placeholder(input) {
  const buf = await sharp(input, { pages: 1 }).rotate().resize({ width: 16 }).blur(1.2).webp({ quality: 40 }).toBuffer();
  return `data:image/webp;base64,${buf.toString('base64')}`;
}

function slug(name) {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

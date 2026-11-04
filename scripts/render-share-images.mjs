#!/usr/bin/env node
// Renders a 1200 × 630 link-preview image for every page into public/share/,
// drawn in the site's style from the same content files the pages use.
//
//   pnpm share-images
//
// Text is set with the site's fonts (scripts/fonts/*.woff) and converted to
// outlines, so the PNGs look the same on every machine.

import { mkdir, readdir, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import sharp from 'sharp';
import { architecturePage } from '../src/content/architecture/page.ts';
import { homeMeta, hero } from '../src/content/home.ts';
import { notFound, privacy, terms } from '../src/content/legal.ts';
import { regions, quorumPeers } from '../src/content/topology.ts';
import { project, routePath } from '../src/lib/geo.ts';
import { siteConfig } from '../src/site.config.ts';

// opentype.js is CommonJS; require it so `parse` is always there.
const opentype = createRequire(import.meta.url)('opentype.js');

const root = new URL('..', import.meta.url);
const path = (p) => fileURLToPath(new URL(p, root));
const C = siteConfig.colors;
const W = 1200;
const H = 630;

const font = async (file) => {
  const buf = await readFile(path(`scripts/fonts/${file}`));
  return opentype.parse(buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength));
};
const sans = await font('archivo-latin-500-normal.woff');
const sansRegular = await font('archivo-latin-400-normal.woff');
const mono = await font('ibm-plex-mono-latin-500-normal.woff');

const worldSvg = await readFile(path('public/world.svg'), 'utf8');
const land = worldSvg.match(/<path[^>]* d="([^"]+)"/)[1];

const sections = [];
for (const file of (await readdir(path('src/content/architecture'))).filter((f) => /^\d+-.*\.ts$/.test(f)).sort()) {
  sections.push((await import(path(`src/content/architecture/${file}`))).section);
}
const newest = sections.map((s) => s.updated).sort().at(-1);

const pages = [
  {
    file: 'home',
    sheet: { ...hero.sheet },
    eyebrow: hero.eyebrow,
    title: homeMeta.shareTitle,
    art: worldArt
  },
  {
    file: 'architecture',
    sheet: { number: architecturePage.sheet.number, name: 'Architecture', revision: sections.map((s) => s.revision).sort().at(-1), scale: 'NTS', date: newest },
    eyebrow: `${sections.length} sections · consistency, replication, failover`,
    title: architecturePage.headline,
    art: failoverArt
  },
  {
    file: 'privacy',
    sheet: { ...privacy.sheet, scale: '—' },
    eyebrow: 'Privacy',
    title: privacy.intro.split('. ')[0] + '.',
    art: listArt(privacy.sections.map((s) => s.heading))
  },
  {
    file: 'terms',
    sheet: { ...terms.sheet, scale: '—' },
    eyebrow: 'Terms',
    title: 'The terms for using this website, in plain language.',
    art: listArt(terms.sections.map((s) => s.heading))
  },
  {
    file: 'not-found',
    sheet: { ...notFound.sheet, scale: '—' },
    eyebrow: 'Sheet X-404',
    title: notFound.title,
    art: stampArt
  }
];

await mkdir(path('public/share'), { recursive: true });
for (const page of pages) {
  const svg = render(page);
  await sharp(Buffer.from(svg)).png({ compressionLevel: 9, palette: true, quality: 90 }).toFile(path(`public/share/${page.file}.png`));
  console.log(`✓ public/share/${page.file}.png`);
}

// ── Layout ─────────────────────────────────────────────────────────────────

function render(page) {
  const parts = [];
  parts.push(`<rect width="${W}" height="${H}" fill="${C.paper}"/>`);
  parts.push(grid());
  // Sheet frame
  parts.push(`<rect x="36" y="36" width="${W - 72}" height="${H - 72}" fill="none" stroke="${C.ink}" stroke-width="1.5"/>`);
  // Header: mark, product, eyebrow
  parts.push(logoMark(64, 64, 32));
  parts.push(text(sans, siteConfig.product, 108, 90, 28, C.ink, -0.02));
  parts.push(text(mono, `by ${siteConfig.company}`.toUpperCase(), 108 + measure(sans, siteConfig.product, 28, -0.02) + 16, 88, 12, C.muted, 0.08));
  parts.push(text(mono, `${page.sheet.number}  —  ${page.eyebrow}`.toUpperCase(), 64, 150, 14, C.blue, 0.08));
  // Title
  const lines = wrap(sans, page.title, 58, 640);
  lines.forEach((line, i) => parts.push(text(sans, line, 62, 222 + i * 66, 58, C.ink, -0.03)));
  // Art
  parts.push(page.art());
  // Title block
  parts.push(titleBlock(page.sheet));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
<pattern id="hb" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="7" stroke="${C.blue}" stroke-width="1.2"/></pattern>
<pattern id="hi" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="6" stroke="${C.ink}" stroke-width="1"/></pattern>
<clipPath id="mapclip"><rect x="640" y="170" width="520" height="208"/></clipPath>
</defs>
${parts.join('\n')}
</svg>`;
}

function grid() {
  const out = [];
  for (let x = 0; x <= W; x += 15) out.push(`<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${C.blue}" stroke-opacity="${x % 75 === 0 ? 0.11 : 0.055}"/>`);
  for (let y = 0; y <= H; y += 15) out.push(`<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${C.blue}" stroke-opacity="${y % 75 === 0 ? 0.11 : 0.055}"/>`);
  return out.join('');
}

function titleBlock(sheet) {
  const cells = [
    ['Sheet', sheet.number, 92],
    ['Title', sheet.name, 250],
    ['Rev', sheet.revision, 62],
    ['Scale', sheet.scale, 74],
    ['Date', sheet.date, 128]
  ];
  const total = cells.reduce((s, c) => s + c[2], 0);
  let x = W - 36 - total;
  const y = H - 36 - 58;
  const out = [`<rect x="${x}" y="${y}" width="${total}" height="58" fill="${C.paper}" stroke="${C.ink}" stroke-width="1.5"/>`];
  cells.forEach(([label, value, w], i) => {
    if (i) out.push(`<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 58}" stroke="${C.ink}" stroke-width="1.5"/>`);
    out.push(text(mono, label.toUpperCase(), x + 12, y + 22, 10, C.muted, 0.1));
    out.push(text(mono, String(value).toUpperCase(), x + 12, y + 44, 14, i === 0 ? C.blue : C.ink, 0.04));
    x += w;
  });
  return out.join('');
}

// The small-size logo (as in favicon.svg): the hatched band is filled flat.
function logoMark(x, top, size) {
  const s = size / 64;
  const bands = (dy) =>
    `<rect x="9" y="${11 + dy}" width="46" height="9" fill="${C.paper}"/><rect x="9.6" y="${26.6 + dy}" width="44.8" height="7.8" fill="${C.paper}" fill-opacity="0.55"/><rect x="9" y="${41 + dy}" width="46" height="9" fill="${C.paper}"/>`;
  return `<g transform="translate(${x} ${top}) scale(${s})">
<clipPath id="ll"><path d="M0 0H37L27 64H0Z"/></clipPath><clipPath id="lr"><path d="M41 0H64V64H31Z"/></clipPath>
<rect width="64" height="64" fill="${C.blue}"/>
<g clip-path="url(#ll)">${bands(0)}</g><g clip-path="url(#lr)">${bands(7)}</g></g>`;
}

// ── Art per page ───────────────────────────────────────────────────────────

function worldArt() {
  // Map box: x 640–1160, y 170–378 (520 × 208 = map at 0.52).
  const s = 0.52;
  const ox = 640;
  const oy = 170;
  const P = (r) => {
    const p = project(r.lat, r.lon);
    return { x: ox + p.x * s, y: oy + p.y * s };
  };
  const out = [`<rect x="${ox}" y="${oy}" width="520" height="208" fill="${C.paper}" stroke="${C.ink}" stroke-width="1.2"/>`];
  out.push(`<g clip-path="url(#mapclip)"><g transform="translate(${ox} ${oy}) scale(${s})"><path d="${land}" fill="none" stroke="${C.blue}" stroke-opacity="0.7" stroke-width="${1.5 / s}" stroke-dasharray="0 ${3.2 / s}" stroke-linecap="round"/>`);
  const seen = new Set();
  for (const r of regions) {
    for (const p of quorumPeers(r.id)) {
      const key = [r.id, p].sort().join();
      if (seen.has(key)) continue;
      seen.add(key);
      const a = project(r.lat, r.lon);
      const b = project(regions.find((x) => x.id === p).lat, regions.find((x) => x.id === p).lon);
      out.push(`<path d="${routePath(a, b)}" fill="none" stroke="${C.blue}" stroke-opacity="0.55" stroke-width="${1.2 / s}"/>`);
    }
  }
  out.push('</g></g>');
  for (const r of regions) {
    const p = P(r);
    out.push(`<circle cx="${p.x}" cy="${p.y}" r="7" fill="${C.paper}" stroke="${C.blue}" stroke-width="1.5"/><circle cx="${p.x}" cy="${p.y}" r="3.2" fill="${C.blue}"/>`);
    const w = measure(mono, r.code, 11, 0.08);
    out.push(`<rect x="${p.x + 8}" y="${p.y - 19}" width="${w + 4}" height="14" fill="${C.paper}"/>`);
    out.push(text(mono, r.code, p.x + 10, p.y - 8, 11, C.blue, 0.08));
  }
  out.push(text(mono, 'FIG. 1 — 6 REGIONS · 3 TO COMMIT · FAILOVER 1.8 S', 640, 404, 12, C.ink, 0.08));
  return out.join('');
}

function failoverArt() {
  const phases = [
    ['Lease expiry', 0, 900],
    ['Election', 900, 1200],
    ['Catch-up', 1200, 1400],
    ['Reconnect', 1400, 1800]
  ];
  const x = (ms) => 760 + ms * 0.21;
  const out = [];
  phases.forEach(([name, a, b], i) => {
    const y = 300 + i * 34;
    out.push(text(mono, name.toUpperCase(), 640, y + 15, 11, C.ink, 0.08));
    out.push(`<rect x="${x(a)}" y="${y}" width="${x(b) - x(a)}" height="20" fill="url(#hb)" stroke="${C.blue}" stroke-width="1.2"/>`);
  });
  out.push(dim(x(0), x(1800), 450, 'TOTAL 1.8 S · 0 WRITES LOST'));
  return out.join('');
}

function listArt(items) {
  return () => {
    const out = [`<rect x="760" y="186" width="400" height="${items.length * 44 + 8}" fill="url(#hi)" opacity="0.25"/>`];
    items.forEach((item, i) => {
      const y = 190 + i * 44;
      out.push(`<rect x="760" y="${y}" width="400" height="40" fill="${C.paper}" stroke="${C.ink}" stroke-width="1.2"/>`);
      out.push(text(mono, String(i + 1).padStart(2, '0'), 774, y + 26, 13, C.blue, 0.08));
      out.push(text(sansRegular, item, 816, y + 27, 19, C.ink, -0.01));
    });
    return out.join('');
  };
}

function stampArt() {
  return `<g transform="translate(880 330) rotate(-7)">
<rect x="-230" y="-58" width="460" height="116" fill="none" stroke="${C.blue}" stroke-width="3"/>
<rect x="-222" y="-50" width="444" height="100" fill="none" stroke="${C.blue}" stroke-width="1.5"/>
${text(mono, 'SHEET NOT FOUND', -196, 14, 40, C.blue, 0.14)}
</g>`;
}

function dim(x1, x2, y, label) {
  const ah = (x, dir) => `<path d="M${x} ${y}L${x - dir * 10} ${y - 3.5}L${x - dir * 10} ${y + 3.5}Z" fill="${C.ink}"/>`;
  const w = measure(mono, label, 11, 0.08);
  return `<line x1="${x1}" y1="${y - 12}" x2="${x1}" y2="${y + 12}" stroke="${C.ink}"/><line x1="${x2}" y1="${y - 12}" x2="${x2}" y2="${y + 12}" stroke="${C.ink}"/>
<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="${C.ink}"/>${ah(x1, -1)}${ah(x2, 1)}
${text(mono, label, (x1 + x2) / 2 - w / 2, y - 8, 11, C.ink, 0.08)}`;
}

// ── Text as outlines ───────────────────────────────────────────────────────

function text(f, str, x, y, size, fill, tracking = 0) {
  let cx = x;
  let prev = null;
  const scale = size / f.unitsPerEm;
  const d = [];
  for (const ch of str) {
    const g = f.charToGlyph(ch);
    const kern = prev ? f.getKerningValue(prev, g) : 0;
    if (Number.isFinite(kern)) cx += kern * scale;
    d.push(pathData(g.getPath(cx, y, size).commands));
    cx += g.advanceWidth * scale + tracking * size;
    prev = g;
  }
  return `<path d="${d.join('')}" fill="${fill}"/>`;
}

// opentype.js 2.0's toPathData misprints some floats as NaN; format here.
function pathData(commands) {
  const n = (v) => (Math.round(v * 100) / 100).toString();
  return commands
    .map((c) => {
      if (c.type === 'M' || c.type === 'L') return `${c.type}${n(c.x)} ${n(c.y)}`;
      if (c.type === 'Q') return `Q${n(c.x1)} ${n(c.y1)} ${n(c.x)} ${n(c.y)}`;
      if (c.type === 'C') return `C${n(c.x1)} ${n(c.y1)} ${n(c.x2)} ${n(c.y2)} ${n(c.x)} ${n(c.y)}`;
      return 'Z';
    })
    .join('');
}

function measure(f, str, size, tracking = 0) {
  const scale = size / f.unitsPerEm;
  let w = 0;
  for (const ch of str) w += (f.charToGlyph(ch).advanceWidth || 0) * scale + tracking * size;
  return w;
}

function wrap(f, str, size, max) {
  const words = str.split(' ');
  const lines = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (measure(f, next, size, -0.03) > max && line) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

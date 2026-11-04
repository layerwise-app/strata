#!/usr/bin/env node
// Builds public/world.svg, the dotted world outline used by every map drawing.
//
// Source: Natural Earth 1:110m land polygons (public domain,
// https://www.naturalearthdata.com). Pass a local GeoJSON file, or let the
// script download ne_110m_land.geojson from the Natural Earth GitHub mirror:
//
//   node scripts/build-world-map.mjs [path/to/ne_110m_land.geojson]

import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { MAP, project } from '../src/lib/geo.ts';

const SOURCE =
  'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_land.geojson';
const OUT = fileURLToPath(new URL('../public/world.svg', import.meta.url));
const TOLERANCE = 0.55; // map units; 1 unit = 0.36°
const SOUTH_LIMIT = -58; // drop Antarctica

const input = process.argv[2];
const geojson = JSON.parse(
  input ? await readFile(input, 'utf8') : await (await fetch(SOURCE)).text()
);

const rings = [];
for (const feature of geojson.features) {
  const { type, coordinates } = feature.geometry;
  const polygons = type === 'Polygon' ? [coordinates] : coordinates;
  for (const polygon of polygons) {
    for (const ring of polygon) {
      if (ring.every(([, lat]) => lat < SOUTH_LIMIT)) continue;
      const pts = ring
        .filter(([, lat]) => lat >= SOUTH_LIMIT - 2)
        .map(([lon, lat]) => project(lat, lon));
      const simple = simplify(pts, TOLERANCE);
      if (simple.length < 4 || area(simple) < 1.2) continue;
      rings.push(simple);
    }
  }
}

// Relative commands with one decimal keep the file small.
const d = rings
  .map((ring) => {
    let px = Math.round(ring[0].x * 10);
    let py = Math.round(ring[0].y * 10);
    const out = `M${px / 10} ${py / 10}l`;
    const steps = [];
    for (const p of ring.slice(1)) {
      const x = Math.round(p.x * 10);
      const y = Math.round(p.y * 10);
      if (x === px && y === py) continue;
      steps.push(`${num((x - px) / 10)}${y - py >= 0 ? ' ' : ''}${num((y - py) / 10)}`);
      px = x;
      py = y;
    }
    return out + steps.join(' ') + 'z';
  })
  .join('');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${MAP.width} ${MAP.height}">
<!-- Land outlines: Natural Earth 1:110m (public domain), plate carrée, Antarctica cropped. -->
<symbol id="land" viewBox="0 0 ${MAP.width} ${MAP.height}"><path vector-effect="non-scaling-stroke" d="${d}"/></symbol>
<use href="#land" fill="none" stroke="#1f45b5" stroke-width="1"/>
</svg>
`;
await writeFile(OUT, svg);
console.log(`wrote ${OUT} (${rings.length} rings, ${(svg.length / 1024).toFixed(1)} KB)`);

function num(n) {
  // 0.5 -> .5, -0.5 -> -.5
  return n.toString().replace(/^(-?)0\./, '$1.');
}

function area(pts) {
  let a = 0;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    a += (pts[j].x + pts[i].x) * (pts[j].y - pts[i].y);
  }
  return Math.abs(a / 2);
}

// Douglas–Peucker
function simplify(pts, tol) {
  if (pts.length < 3) return pts;
  const keep = new Uint8Array(pts.length);
  keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [s, e] = stack.pop();
    let max = 0;
    let idx = -1;
    for (let i = s + 1; i < e; i++) {
      const dist = segDist(pts[i], pts[s], pts[e]);
      if (dist > max) {
        max = dist;
        idx = i;
      }
    }
    if (max > tol && idx > 0) {
      keep[idx] = 1;
      stack.push([s, idx], [idx, e]);
    }
  }
  return pts.filter((_, i) => keep[i]);
}

function segDist(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len2 = dx * dx + dy * dy;
  if (!len2) return Math.hypot(p.x - a.x, p.y - a.y);
  const t = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / len2));
  return Math.hypot(p.x - (a.x + t * dx), p.y - (a.y + t * dy));
}

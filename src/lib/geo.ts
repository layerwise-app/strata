/**
 * Map projection shared by every drawing: plate carrée (equirectangular), so
 * the graticule lines up with the drafting grid. Antarctica is cropped.
 */
export const MAP = {
  width: 1000,
  height: 400,
  /** Latitude at the top edge. */
  north: 84,
  /** Degrees per map unit. */
  degPerUnit: 360 / 1000
} as const;

export type Point = { x: number; y: number };

export function project(lat: number, lon: number): Point {
  return {
    x: ((lon + 180) / 360) * MAP.width,
    y: (MAP.north - lat) / MAP.degPerUnit
  };
}

/**
 * Shift `b` by a whole map width when that makes the hop shorter, so routes
 * across the Pacific leave one edge and come back on the other.
 */
export function unwrap(a: Point, b: Point): Point {
  const dx = b.x - a.x;
  if (dx > MAP.width / 2) return { x: b.x - MAP.width, y: b.y };
  if (dx < -MAP.width / 2) return { x: b.x + MAP.width, y: b.y };
  return b;
}

/** Control point for a gentle arc between two points, bowed toward the pole. */
export function arcControl(a: Point, b: Point, bend = 0.16): Point {
  const mx = (a.x + b.x) / 2;
  const my = (a.y + b.y) / 2;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  // Perpendicular, flipped so arcs bow upward (north) on the drawing.
  let nx = -dy / len;
  let ny = dx / len;
  if (ny > 0) {
    nx = -nx;
    ny = -ny;
  }
  return { x: mx + nx * len * bend, y: my + ny * len * bend };
}

export function quadPoint(a: Point, c: Point, b: Point, t: number): Point {
  const u = 1 - t;
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y
  };
}

/** SVG path for a route, drawn twice when it wraps so both halves show. */
export function routePath(a: Point, b: Point, bend = 0.16): string {
  const b2 = unwrap(a, b);
  const c = arcControl(a, b2, bend);
  const d = `M${r(a.x)} ${r(a.y)}Q${r(c.x)} ${r(c.y)} ${r(b2.x)} ${r(b2.y)}`;
  if (b2.x === b.x) return d;
  const shift = b.x - b2.x;
  return `${d}M${r(a.x + shift)} ${r(a.y)}Q${r(c.x + shift)} ${r(c.y)} ${r(b.x)} ${r(b.y)}`;
}

/** Straight path, also wrapped across the date line when shorter. */
export function linePath(a: Point, b: Point): string {
  const b2 = unwrap(a, b);
  const d = `M${r(a.x)} ${r(a.y)}L${r(b2.x)} ${r(b2.y)}`;
  if (b2.x === b.x) return d;
  const shift = b.x - b2.x;
  return `${d}M${r(a.x + shift)} ${r(a.y)}L${r(b.x)} ${r(b.y)}`;
}

/** Great-circle distance in kilometres. */
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLon = (lon2 - lon1) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLon / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.sqrt(h));
}

function r(n: number) {
  return Math.round(n * 10) / 10;
}

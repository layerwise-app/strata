/**
 * Strata's sample topology: six regions, the round trips between them, and
 * twelve cities where Pinecart (the sample customer) has users.
 *
 * Everything here is typed sample data. The hero drawing, the latency
 * explorer, the architecture diagrams and the share images all read it.
 */

export type RegionId = 'ore' | 'vir' | 'sao' | 'fra' | 'sin' | 'syd';

export type Region = {
  id: RegionId;
  /** Three-letter code drawn on the map. */
  code: string;
  name: string;
  /** Short location note for tables. */
  zone: string;
  lat: number;
  lon: number;
  /** Where the label sits relative to the node on the map. */
  label: 'left' | 'right' | 'above' | 'below';
};

export type Percentiles = { p50: number; p99: number };
export type OperationLatency = { read: Percentiles; write: Percentiles };

export type City = {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  /** Round trip from the city to each region, in milliseconds. */
  rttMs: Record<RegionId, number>;
  /** Measured latency in milliseconds, single region versus Strata. */
  latency: { single: OperationLatency; strata: OperationLatency };
};

export const regions: Region[] = [
  { id: 'ore', code: 'ORE', name: 'Oregon', zone: 'US West', lat: 45.6, lon: -121.2, label: 'left' },
  { id: 'vir', code: 'VIR', name: 'Virginia', zone: 'US East', lat: 38.9, lon: -77.5, label: 'right' },
  { id: 'sao', code: 'SAO', name: 'São Paulo', zone: 'South America', lat: -23.5, lon: -46.6, label: 'right' },
  { id: 'fra', code: 'FRA', name: 'Frankfurt', zone: 'Europe Central', lat: 50.1, lon: 8.7, label: 'above' },
  { id: 'sin', code: 'SIN', name: 'Singapore', zone: 'Asia Southeast', lat: 1.35, lon: 103.8, label: 'below' },
  { id: 'syd', code: 'SYD', name: 'Sydney', zone: 'Australia East', lat: -33.9, lon: 151.2, label: 'right' }
];

/** Round trips between regions, in milliseconds. Listed once per pair. */
export const regionRttMs: Record<`${RegionId}-${RegionId}`, number> = {
  'ore-vir': 65,
  'ore-sao': 175,
  'ore-fra': 150,
  'ore-sin': 165,
  'ore-syd': 140,
  'vir-sao': 115,
  'vir-fra': 90,
  'vir-sin': 215,
  'vir-syd': 200,
  'sao-fra': 205,
  'sao-sin': 325,
  'sao-syd': 310,
  'fra-sin': 160,
  'fra-syd': 250,
  'sin-syd': 92
} as Record<`${RegionId}-${RegionId}`, number>;

export const replication = {
  /** Regions that must log a write before it commits (the writer plus two). */
  commitQuorum: 3,
  /** Regions that must agree to hand out a write lease or elect a leader. */
  leaseQuorum: 4,
  /** Median time to move leadership away from a lost region, in seconds. */
  failoverSeconds: 1.8,
  /** How stale a local read may be when it is served from the nearest copy. */
  readStaleness: '2 s',
  /** The comparison in the latency explorer. */
  singleRegion: 'vir' as RegionId
};

/** What the latency explorer measures, shown under its table. */
export const measurement = {
  read: 'Read: one-row SELECT by primary key.',
  write:
    'Write: add-to-cart transaction (SELECT … FOR UPDATE, UPDATE, COMMIT), serializable.',
  method:
    'Sample data: 10,000 requests per city from a client in a nearby data center, October 2026.'
};

export const cities: City[] = [
  {
    id: 'vancouver',
    name: 'Vancouver',
    country: 'Canada',
    lat: 49.28,
    lon: -123.12,
    rttMs: { ore: 8, vir: 70, sao: 180, fra: 150, sin: 170, syd: 145 },
    latency: {
      single: { read: { p50: 71, p99: 121 }, write: { p50: 213, p99: 314 } },
      strata: { read: { p50: 9, p99: 21 }, write: { p50: 167, p99: 235 } }
    }
  },
  {
    id: 'chicago',
    name: 'Chicago',
    country: 'United States',
    lat: 41.88,
    lon: -87.63,
    rttMs: { ore: 50, vir: 18, sao: 130, fra: 100, sin: 220, syd: 190 },
    latency: {
      single: { read: { p50: 19, p99: 45 }, write: { p50: 57, p99: 102 } },
      strata: { read: { p50: 19, p99: 45 }, write: { p50: 147, p99: 219 } }
    }
  },
  {
    id: 'mexico-city',
    name: 'Mexico City',
    country: 'Mexico',
    lat: 19.43,
    lon: -99.13,
    rttMs: { ore: 55, vir: 48, sao: 150, fra: 135, sin: 230, syd: 180 },
    latency: {
      single: { read: { p50: 49, p99: 90 }, write: { p50: 147, p99: 222 } },
      strata: { read: { p50: 49, p99: 90 }, write: { p50: 237, p99: 332 } }
    }
  },
  {
    id: 'bogota',
    name: 'Bogotá',
    country: 'Colombia',
    lat: 4.71,
    lon: -74.07,
    rttMs: { ore: 95, vir: 65, sao: 90, fra: 150, sin: 275, syd: 250 },
    latency: {
      single: { read: { p50: 66, p99: 115 }, write: { p50: 198, p99: 285 } },
      strata: { read: { p50: 66, p99: 115 }, write: { p50: 288, p99: 384 } }
    }
  },
  {
    id: 'buenos-aires',
    name: 'Buenos Aires',
    country: 'Argentina',
    lat: -34.6,
    lon: -58.38,
    rttMs: { ore: 175, vir: 135, sao: 35, fra: 230, sin: 340, syd: 320 },
    latency: {
      single: { read: { p50: 136, p99: 218 }, write: { p50: 408, p99: 564 } },
      strata: { read: { p50: 36, p99: 65 }, write: { p50: 283, p99: 383 } }
    }
  },
  {
    id: 'london',
    name: 'London',
    country: 'United Kingdom',
    lat: 51.51,
    lon: -0.13,
    rttMs: { ore: 140, vir: 78, sao: 195, fra: 14, sin: 170, syd: 260 },
    latency: {
      single: { read: { p50: 79, p99: 129 }, write: { p50: 237, p99: 336 } },
      strata: { read: { p50: 15, p99: 32 }, write: { p50: 195, p99: 281 } }
    }
  },
  {
    id: 'madrid',
    name: 'Madrid',
    country: 'Spain',
    lat: 40.42,
    lon: -3.7,
    rttMs: { ore: 155, vir: 92, sao: 200, fra: 30, sin: 180, syd: 270 },
    latency: {
      single: { read: { p50: 93, p99: 148 }, write: { p50: 279, p99: 400 } },
      strata: { read: { p50: 31, p99: 59 }, write: { p50: 243, p99: 328 } }
    }
  },
  {
    id: 'lagos',
    name: 'Lagos',
    country: 'Nigeria',
    lat: 6.52,
    lon: 3.38,
    rttMs: { ore: 230, vir: 180, sao: 260, fra: 95, sin: 250, syd: 330 },
    latency: {
      single: { read: { p50: 181, p99: 279 }, write: { p50: 543, p99: 760 } },
      strata: { read: { p50: 96, p99: 163 }, write: { p50: 438, p99: 570 } }
    }
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    country: 'India',
    lat: 19.08,
    lon: 72.88,
    rttMs: { ore: 230, vir: 190, sao: 310, fra: 110, sin: 58, syd: 150 },
    latency: {
      single: { read: { p50: 191, p99: 287 }, write: { p50: 573, p99: 822 } },
      strata: { read: { p50: 59, p99: 101 }, write: { p50: 337, p99: 444 } }
    }
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'Japan',
    lat: 35.68,
    lon: 139.69,
    rttMs: { ore: 95, vir: 150, sao: 260, fra: 225, sin: 68, syd: 115 },
    latency: {
      single: { read: { p50: 151, p99: 238 }, write: { p50: 453, p99: 630 } },
      strata: { read: { p50: 69, p99: 113 }, write: { p50: 367, p99: 497 } }
    }
  },
  {
    id: 'jakarta',
    name: 'Jakarta',
    country: 'Indonesia',
    lat: -6.21,
    lon: 106.85,
    rttMs: { ore: 180, vir: 230, sao: 340, fra: 175, sin: 14, syd: 100 },
    latency: {
      single: { read: { p50: 231, p99: 349 }, write: { p50: 693, p99: 952 } },
      strata: { read: { p50: 15, p99: 30 }, write: { p50: 205, p99: 294 } }
    }
  },
  {
    id: 'auckland',
    name: 'Auckland',
    country: 'New Zealand',
    lat: -36.85,
    lon: 174.76,
    rttMs: { ore: 135, vir: 215, sao: 320, fra: 280, sin: 120, syd: 28 },
    latency: {
      single: { read: { p50: 216, p99: 324 }, write: { p50: 648, p99: 921 } },
      strata: { read: { p50: 29, p99: 53 }, write: { p50: 227, p99: 309 } }
    }
  }
];

/** The city the latency explorer opens on. */
export const defaultCityId = 'jakarta';

// ── Helpers ────────────────────────────────────────────────────────────────

export function regionById(id: RegionId): Region {
  const region = regions.find((r) => r.id === id);
  if (!region) throw new Error(`Unknown region ${id}`);
  return region;
}

export function rttBetween(a: RegionId, b: RegionId): number {
  if (a === b) return 0;
  return regionRttMs[`${a}-${b}`] ?? regionRttMs[`${b}-${a}`];
}

/** The live region with the shortest round trip from a city. */
export function servingRegion(city: City, down: ReadonlySet<RegionId> = new Set()) {
  let best: RegionId | null = null;
  for (const region of regions) {
    if (down.has(region.id)) continue;
    if (best === null || city.rttMs[region.id] < city.rttMs[best]) best = region.id;
  }
  return best;
}

/** The two live regions nearest a writer: together they form its commit quorum. */
export function quorumPeers(writer: RegionId, down: ReadonlySet<RegionId> = new Set()) {
  return regions
    .filter((r) => r.id !== writer && !down.has(r.id))
    .sort((a, b) => rttBetween(writer, a.id) - rttBetween(writer, b.id))
    .slice(0, replication.commitQuorum - 1)
    .map((r) => r.id);
}

/** Writes need a lease from `leaseQuorum` live regions. */
export function writesAvailable(down: ReadonlySet<RegionId>) {
  return regions.length - down.size >= replication.leaseQuorum;
}

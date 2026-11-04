import { describe, expect, it } from 'vitest';
import {
  cities,
  defaultCityId,
  quorumPeers,
  regions,
  replication,
  rttBetween,
  servingRegion,
  writesAvailable,
  type RegionId
} from '~/content/topology';

const down = (...ids: RegionId[]) => new Set<RegionId>(ids);

describe('quorum model', () => {
  it('needs a lease quorum that overlaps every commit quorum', () => {
    // A new leader must see every committed write: lease + commit > regions.
    expect(replication.leaseQuorum + replication.commitQuorum).toBeGreaterThan(regions.length);
  });

  it('keeps writes up with two regions down and pauses them at three', () => {
    expect(writesAvailable(down())).toBe(true);
    expect(writesAvailable(down('fra', 'vir'))).toBe(true);
    expect(writesAvailable(down('fra', 'vir', 'sin'))).toBe(false);
  });

  it('commits each write with the two nearest live regions', () => {
    for (const writer of regions) {
      const peers = quorumPeers(writer.id);
      expect(peers).toHaveLength(replication.commitQuorum - 1);
      const others = regions.filter((r) => r.id !== writer.id && !peers.includes(r.id));
      const farthestPeer = Math.max(...peers.map((p) => rttBetween(writer.id, p)));
      for (const r of others) expect(rttBetween(writer.id, r.id)).toBeGreaterThanOrEqual(farthestPeer);
    }
  });

  it('reroutes the quorum around regions that are down', () => {
    const peers = quorumPeers('ore', down('vir'));
    expect(peers).not.toContain('vir');
    expect(peers).toHaveLength(2);
  });

  it('has a round trip for every pair of regions', () => {
    for (const a of regions) for (const b of regions) {
      expect(rttBetween(a.id, b.id)).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('latency data', () => {
  it('has twelve cities, including the default one', () => {
    expect(cities).toHaveLength(12);
    expect(new Set(cities.map((c) => c.id)).size).toBe(12);
    expect(cities.some((c) => c.id === defaultCityId)).toBe(true);
  });

  it.each(cities.map((c) => [c.name, c] as const))('%s has consistent numbers', (_name, city) => {
    for (const mode of ['single', 'strata'] as const) {
      for (const op of ['read', 'write'] as const) {
        const { p50, p99 } = city.latency[mode][op];
        expect(p50).toBeGreaterThan(0);
        expect(p99).toBeGreaterThanOrEqual(p50);
      }
    }
    // Reads are served from the nearest copy, so they are never slower.
    expect(city.latency.strata.read.p50).toBeLessThanOrEqual(city.latency.single.read.p50);
    // The nearest region answers in about one round trip.
    const serving = servingRegion(city);
    expect(serving).not.toBeNull();
    expect(Math.abs(city.latency.strata.read.p50 - city.rttMs[serving!])).toBeLessThanOrEqual(5);
  });

  it('serves a city from its next-nearest region when the nearest is down', () => {
    const london = cities.find((c) => c.id === 'london')!;
    expect(servingRegion(london)).toBe('fra');
    expect(servingRegion(london, down('fra'))).toBe('vir');
  });
});

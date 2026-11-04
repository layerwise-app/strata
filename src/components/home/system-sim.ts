/**
 * Packet animation for the hero drawing. Loaded after first paint; the
 * drawing is complete without it. Draws into an SVG layer with plain DOM
 * calls so a frame never re-renders React.
 */
import {
  cities,
  quorumPeers,
  regions,
  rttBetween,
  servingRegion,
  type City,
  type RegionId
} from '~/content/topology';
import { arcControl, project, quadPoint, unwrap, type Point } from '~/lib/geo';

export type SimState = {
  down: ReadonlySet<RegionId>;
  /** performance.now() until which moved writes wait for new leases. */
  failoverUntil: number;
  /** Regions whose clients are being moved during the failover. */
  failoverFrom: ReadonlySet<RegionId>;
  writesPaused: boolean;
};

export type SimHandle = {
  setRunning(running: boolean): void;
  /** Re-send writes that waited while writes were paused. */
  flush(): void;
  stop(): void;
};

type Kind = 'request' | 'replicate' | 'ack' | 'response';

const STYLE: Record<Kind, { stroke: string; width: number; dash: string; px: number; cap?: string }> = {
  request: { stroke: 'var(--ink-blue)', width: 1.6, dash: '3 2.5', px: 22 },
  replicate: { stroke: 'var(--ink-blue)', width: 1.6, dash: '8 3', px: 30 },
  ack: { stroke: 'var(--ink)', width: 2.6, dash: '0 5', px: 16, cap: 'round' },
  response: { stroke: 'var(--ink)', width: 1, dash: '2 2', px: 14 }
};

type Route = { a: Point; c: Point | null; b: Point; shift: number; len: number };

type Packet = {
  el: SVGPathElement;
  route: Route;
  kind: Kind;
  start: number;
  dur: number;
  onArrive: (now: number) => void;
};

type Effect = { el: SVGElement; start: number; dur: number; update: (t: number) => void };

const NS = 'http://www.w3.org/2000/svg';
const regionPoint = Object.fromEntries(
  regions.map((r) => [r.id, project(r.lat, r.lon)])
) as Record<RegionId, Point>;
const cityPoint = Object.fromEntries(cities.map((c) => [c.id, project(c.lat, c.lon)]));

export function startSim(opts: {
  svg: SVGSVGElement;
  layer: SVGGElement;
  getState: () => SimState;
  onCommit: (count: number) => void;
  onQueued: (count: number) => void;
}): SimHandle {
  const { svg, layer, getState, onCommit, onQueued } = opts;
  let packets: Packet[] = [];
  let effects: Effect[] = [];
  let waiting: { city: City; at: number }[] = [];
  let parked: { city: City; leader: RegionId }[] = [];
  let commits = 0;
  let running = false;
  let raf = 0;
  let pausedAt = 0;
  let nextSpawn = performance.now() + 200;
  let scale = svg.getBoundingClientRect().width / 1000 || 1;

  const resize = new ResizeObserver(() => {
    scale = svg.getBoundingClientRect().width / 1000 || 1;
  });
  resize.observe(svg);

  function route(a: Point, b: Point, curved: boolean): Route {
    const b2 = unwrap(a, b);
    const c = curved ? arcControl(a, b2) : null;
    const len = Math.hypot(b2.x - a.x, b2.y - a.y) * (curved ? 1.06 : 1);
    return { a, c, b: b2, shift: b.x - b2.x, len };
  }

  function at(r: Route, t: number): Point {
    if (r.c) return quadPoint(r.a, r.c, r.b, t);
    return { x: r.a.x + (r.b.x - r.a.x) * t, y: r.a.y + (r.b.y - r.a.y) * t };
  }

  function send(
    kind: Kind,
    from: Point,
    to: Point,
    rtt: number,
    now: number,
    onArrive: (now: number) => void
  ) {
    const el = document.createElementNS(NS, 'path');
    const s = STYLE[kind];
    el.setAttribute('fill', 'none');
    el.setAttribute('stroke', s.stroke);
    el.setAttribute('stroke-width', String(s.width));
    el.setAttribute('stroke-dasharray', s.dash);
    el.setAttribute('vector-effect', 'non-scaling-stroke');
    if (s.cap) el.setAttribute('stroke-linecap', s.cap);
    layer.appendChild(el);
    const curved = kind === 'replicate' || kind === 'ack';
    // One-way trip, slowed down so the eye can follow it.
    const dur = Math.min(1500, Math.max(380, 300 + rtt * 4.6));
    packets.push({ el, route: route(from, to, curved), kind, start: now, dur, onArrive });
  }

  function effect(el: SVGElement, now: number, dur: number, update: (t: number) => void) {
    layer.appendChild(el);
    effects.push({ el, start: now, dur, update });
  }

  function pulse(region: RegionId, now: number) {
    const p = regionPoint[region];
    const ring = document.createElementNS(NS, 'circle');
    ring.setAttribute('cx', String(p.x));
    ring.setAttribute('cy', String(p.y));
    ring.setAttribute('fill', 'none');
    ring.setAttribute('stroke', 'var(--ink-blue)');
    ring.setAttribute('vector-effect', 'non-scaling-stroke');
    effect(ring, now, 700, (t) => {
      ring.setAttribute('r', String((9 + t * 16) / scale));
      ring.setAttribute('stroke-opacity', String(1 - t));
    });
  }

  function drop(p: Point, now: number) {
    const mark = document.createElementNS(NS, 'path');
    const k = 4 / scale;
    mark.setAttribute(
      'd',
      `M${p.x - k} ${p.y - k}L${p.x + k} ${p.y + k}M${p.x + k} ${p.y - k}L${p.x - k} ${p.y + k}`
    );
    mark.setAttribute('stroke', 'var(--ink)');
    mark.setAttribute('vector-effect', 'non-scaling-stroke');
    effect(mark, now, 600, (t) => mark.setAttribute('stroke-opacity', String(1 - t)));
  }

  /** A client write that got no commit reply is retried; that is why none is lost. */
  function retry(city: City, now: number) {
    const state = getState();
    waiting.push({ city, at: Math.max(now, state.failoverUntil) + 120 });
  }

  function clientRequest(city: City, now: number, write: boolean) {
    const state = getState();
    const leader = servingRegion(city, state.down);
    if (!leader) return;
    const home = servingRegion(city);
    if (write && home && state.failoverFrom.has(home) && state.failoverUntil > now) {
      waiting.push({ city, at: state.failoverUntil + 80 + Math.random() * 300 });
      return;
    }
    const from = cityPoint[city.id];
    send('request', from, regionPoint[leader], city.rttMs[leader], now, (t) => {
      const s = getState();
      if (s.down.has(leader)) {
        drop(regionPoint[leader], t);
        if (write) retry(city, t);
        return;
      }
      if (!write) {
        send('response', regionPoint[leader], from, city.rttMs[leader], t, () => {});
        return;
      }
      if (s.writesPaused) {
        parked.push({ city, leader });
        onQueued(parked.length);
        return;
      }
      replicate(city, leader, t);
    });
  }

  function replicate(city: City, leader: RegionId, now: number) {
    const used = new Set<RegionId>([leader]);
    let acks = 0;
    let done = false;
    const toPeer = (peer: RegionId, t0: number) => {
      used.add(peer);
      const rtt = rttBetween(leader, peer);
      send('replicate', regionPoint[leader], regionPoint[peer], rtt, t0, (t1) => {
        const s = getState();
        if (s.down.has(peer)) {
          drop(regionPoint[peer], t1);
          // The quorum re-forms around the next nearest live region.
          const next = quorumPeers(leader, s.down).find((r) => !used.has(r));
          if (next && !s.down.has(leader)) toPeer(next, t1);
          return;
        }
        send('ack', regionPoint[peer], regionPoint[leader], rtt, t1, (t2) => {
          const s2 = getState();
          if (done) return;
          if (s2.down.has(leader)) {
            done = true;
            drop(regionPoint[leader], t2);
            retry(city, t2);
            return;
          }
          acks += 1;
          if (acks === 2) {
            done = true;
            commits += 1;
            onCommit(commits);
            pulse(leader, t2);
            send('response', regionPoint[leader], cityPoint[city.id], city.rttMs[leader], t2, () => {});
          }
        });
      });
    };
    for (const peer of quorumPeers(leader, getState().down)) toPeer(peer, now);
  }

  function frame(now: number) {
    if (!running) return;
    while (nextSpawn <= now) {
      const city = cities[Math.floor(Math.random() * cities.length)];
      clientRequest(city, nextSpawn, Math.random() < 0.4);
      nextSpawn += 260 + Math.random() * 380;
    }
    if (waiting.length && !getState().writesPaused) {
      const ready = waiting.filter((w) => w.at <= now);
      if (ready.length) {
        waiting = waiting.filter((w) => w.at > now);
        for (const w of ready) clientRequest(w.city, now, true);
      }
    }

    // Packets sent from onArrive land in the fresh array and draw next frame.
    const current = packets;
    packets = [];
    for (const p of current) {
      const t = (now - p.start) / p.dur;
      if (t >= 1) {
        p.el.remove();
        p.onArrive(p.start + p.dur);
        continue;
      }
      draw(p, Math.max(0, t));
      packets.push(p);
    }

    effects = effects.filter((e) => {
      const t = (now - e.start) / e.dur;
      if (t >= 1) {
        e.el.remove();
        return false;
      }
      e.update(Math.max(0, t));
      return true;
    });
    raf = requestAnimationFrame(frame);
  }

  function draw(p: Packet, t: number) {
    const r = p.route;
    const lenT = STYLE[p.kind].px / scale / Math.max(r.len, 1);
    const t0 = Math.max(0, t - lenT);
    const a = at(r, t0);
    const m = at(r, (t0 + t) / 2);
    const b = at(r, t);
    let d = `M${a.x} ${a.y}L${m.x} ${m.y}L${b.x} ${b.y}`;
    if (r.shift) {
      const s = r.shift;
      d += `M${a.x + s} ${a.y}L${m.x + s} ${m.y}L${b.x + s} ${b.y}`;
    }
    p.el.setAttribute('d', d);
  }

  return {
    setRunning(next) {
      if (next === running) return;
      running = next;
      const now = performance.now();
      if (running) {
        const delta = pausedAt ? now - pausedAt : 0;
        for (const p of packets) p.start += delta;
        for (const e of effects) e.start += delta;
        for (const w of waiting) w.at += delta;
        nextSpawn = Math.max(nextSpawn + delta, now);
        raf = requestAnimationFrame(frame);
      } else {
        pausedAt = now;
        cancelAnimationFrame(raf);
      }
    },
    flush() {
      const now = performance.now();
      const queued = parked;
      parked = [];
      onQueued(0);
      queued.forEach((q, i) => {
        const s = getState();
        const leader = s.down.has(q.leader) ? servingRegion(q.city, s.down) : q.leader;
        if (leader) replicate(q.city, leader, now + i * 40);
      });
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      resize.disconnect();
      for (const p of packets) p.el.remove();
      for (const e of effects) e.el.remove();
      packets = [];
      effects = [];
    }
  };
}

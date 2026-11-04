import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { hero } from '~/content/home';
import {
  cities,
  quorumPeers,
  regionById,
  regions,
  replication,
  servingRegion,
  writesAvailable,
  type RegionId
} from '~/content/topology';
import { useOnScreen, useReducedMotion } from '~/hooks/use-motion';
import { linePath, project, routePath, type Point } from '~/lib/geo';
import { cn } from '~/lib/utils';
import { MapBase, MapDegrees, pct } from './MapBase';
import type { SimHandle, SimState } from './system-sim';

const copy = hero.readout;
const FAILOVER_MS = replication.failoverSeconds * 1000;

const regionPoint = Object.fromEntries(
  regions.map((r) => [r.id, project(r.lat, r.lon)])
) as Record<RegionId, Point>;
const cityPoint = Object.fromEntries(cities.map((c) => [c.id, project(c.lat, c.lon)]));

type Event =
  | { type: 'healthy' }
  | { type: 'down'; region: RegionId; settled: boolean }
  | { type: 'paused' }
  | { type: 'restored'; region: RegionId }
  | { type: 'resumed' }
  | { type: 'limit' };

type Link = { key: string; d: string; kind: 'client' | 'quorum' };

function linksFor(down: ReadonlySet<RegionId>): Link[] {
  const out: Link[] = [];
  for (const city of cities) {
    const r = servingRegion(city, down);
    if (!r) continue;
    out.push({
      key: `c:${city.id}:${r}`,
      d: linePath(cityPoint[city.id], regionPoint[r]),
      kind: 'client'
    });
  }
  const seen = new Set<string>();
  for (const region of regions) {
    if (down.has(region.id)) continue;
    for (const peer of quorumPeers(region.id, down)) {
      const key = `q:${[region.id, peer].sort().join('-')}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ key, d: routePath(regionPoint[region.id], regionPoint[peer]), kind: 'quorum' });
    }
  }
  return out;
}

function fill(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, k: string) => values[k] ?? '');
}

function listNames(ids: RegionId[]) {
  const names = ids.map((id) => regionById(id).name);
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} and ${names.at(-1)}` : names[0];
}

export function SystemDrawing() {
  const [down, setDown] = useState<RegionId[]>([]);
  const [event, setEvent] = useState<Event>({ type: 'healthy' });
  const [fresh, setFresh] = useState<Set<string>>(new Set());
  const [ghosts, setGhosts] = useState<Link[]>([]);
  const [failoverStart, setFailoverStart] = useState<number | null>(null);
  const [queued, setQueued] = useState(0);
  const [drawMs, setDrawMs] = useState(FAILOVER_MS);
  const reduced = useReducedMotion();

  const frameRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const layerRef = useRef<SVGGElement>(null);
  const commitEls = useRef(new Set<HTMLElement>());
  const registerCommit = useCallback((el: HTMLElement | null) => {
    if (el) commitEls.current.add(el);
  }, []);
  const simRef = useRef<SimHandle | null>(null);
  const timers = useRef<number[]>([]);
  const simState = useRef<SimState>({
    down: new Set(),
    failoverUntil: 0,
    failoverFrom: new Set(),
    writesPaused: false
  });
  const onScreen = useOnScreen(frameRef);

  const downSet = useMemo(() => new Set(down), [down]);
  const links = useMemo(() => linksFor(downSet), [downSet]);

  // Load the packet engine after first paint, and only when motion is wanted.
  useEffect(() => {
    if (reduced) return;
    let cancelled = false;
    const start = () =>
      import('./system-sim').then(({ startSim }) => {
        if (cancelled || !svgRef.current || !layerRef.current) return;
        simRef.current = startSim({
          svg: svgRef.current,
          layer: layerRef.current,
          getState: () => simState.current,
          onCommit: (n) => {
            const text = n.toLocaleString('en-US');
            for (const el of commitEls.current) el.textContent = text;
          },
          onQueued: setQueued
        });
        simRef.current.setRunning(document.visibilityState === 'visible');
      });
    const hasIdle = typeof window.requestIdleCallback === 'function';
    const idle = hasIdle
      ? window.requestIdleCallback(start, { timeout: 1200 })
      : window.setTimeout(start, 300);
    return () => {
      cancelled = true;
      if (hasIdle) window.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
      simRef.current?.stop();
      simRef.current = null;
    };
  }, [reduced]);

  useEffect(() => {
    simRef.current?.setRunning(onScreen);
  }, [onScreen]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(window.setTimeout(fn, ms));
  }, []);

  const toggle = useCallback(
    (id: RegionId) => {
      const isDown = down.includes(id);
      if (!isDown && down.length >= 3) {
        setEvent({ type: 'limit' });
        return;
      }
      const next = isDown ? down.filter((d) => d !== id) : [...down, id];
      const nextSet = new Set(next);
      const before = linksFor(downSet);
      const after = linksFor(nextSet);
      const beforeKeys = new Set(before.map((l) => l.key));
      const afterKeys = new Set(after.map((l) => l.key));
      const drawIn = reduced ? new Set<string>() : new Set(after.filter((l) => !beforeKeys.has(l.key)).map((l) => l.key));
      setFresh(drawIn);
      setGhosts(reduced ? [] : before.filter((l) => !afterKeys.has(l.key)));
      setDrawMs(isDown ? 700 : FAILOVER_MS);
      setDown(next);

      const now = performance.now();
      const paused = !writesAvailable(nextSet);
      simState.current = {
        down: nextSet,
        failoverUntil: isDown ? 0 : now + FAILOVER_MS,
        failoverFrom: isDown ? new Set() : new Set([id]),
        writesPaused: paused
      };

      if (!isDown) {
        if (paused) {
          setEvent({ type: 'paused' });
          setFailoverStart(null);
        } else {
          setEvent({ type: 'down', region: id, settled: reduced });
          setFailoverStart(reduced ? null : now);
          if (!reduced) {
            later(() => {
              setEvent((e) => (e.type === 'down' && e.region === id ? { ...e, settled: true } : e));
              setFailoverStart(null);
            }, FAILOVER_MS);
          }
        }
      } else if (down.length === 3) {
        setEvent({ type: 'resumed' });
        simRef.current?.flush();
      } else {
        setEvent({ type: 'restored', region: id });
      }
      later(() => {
        setFresh(new Set());
        setGhosts([]);
      }, isDown ? 700 : FAILOVER_MS + 100);
    },
    [down, downSet, reduced, later]
  );

  const reset = () => {
    setDown([]);
    setFresh(new Set());
    setGhosts([]);
    setFailoverStart(null);
    simState.current = { down: new Set(), failoverUntil: 0, failoverFrom: new Set(), writesPaused: false };
    simRef.current?.flush();
    setEvent({ type: 'healthy' });
  };

  const status = statusLine(event, down);
  const paused = !writesAvailable(downSet);

  return (
    <figure className='relative'>
      <figcaption className='flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 pb-3'>
        <span className='annot text-ink'>{hero.figure}</span>
        <span className='annot hidden text-ink-muted md:inline'>{hero.instruction}</span>
        <span className='annot text-ink-muted md:hidden'>{hero.instructionTouch}</span>
      </figcaption>

      <div className='relative md:mx-7 md:mb-6'>
        <div
          ref={frameRef}
          className='relative aspect-[5/2] w-full border border-ink bg-paper'
        >
          <MapBase svgRef={svgRef} title='World map with six Strata regions and the routes between them'>
            {/* Replication links between quorum partners. */}
            <g fill='none' strokeWidth='1'>
              {ghosts.map((l) => (
                <path
                  key={`ghost-${l.key}`}
                  d={l.d}
                  stroke={l.kind === 'quorum' ? 'var(--ink-blue)' : 'var(--ink)'}
                  strokeDasharray='2 3'
                  vectorEffect='non-scaling-stroke'
                  className='sys-ghost'
                />
              ))}
              {links.map((l) =>
                fresh.has(l.key) ? (
                  <DrawIn key={l.key} link={l} ms={drawMs} />
                ) : (
                  <LinkPath key={l.key} link={l} />
                )
              )}
            </g>
            {/* City dots: clients. */}
            <g stroke='var(--ink)' strokeWidth='4' strokeLinecap='round'>
              {cities.map((c) => {
                const p = cityPoint[c.id];
                return <path key={c.id} d={`M${p.x} ${p.y}h0`} vectorEffect='non-scaling-stroke' />;
              })}
            </g>
            <g ref={layerRef} />
          </MapBase>

          {regions.map((r) => (
            <RegionNode
              key={r.id}
              id={r.id}
              down={downSet.has(r.id)}
              paused={paused}
              onToggle={toggle}
            />
          ))}

          <Readout
            className='absolute bottom-3 left-3 hidden w-[21rem] xl:block'
            status={status}
            down={down}
            paused={paused}
            queued={queued}
            failoverStart={failoverStart}
            settled={event.type === 'down' && event.settled}
            registerCommit={registerCommit}
            onReset={reset}
          />
        </div>
        <MapDegrees />
      </div>

      <Legend />

      <Readout
        className='mt-4 xl:hidden'
        status={status}
        down={down}
        paused={paused}
        queued={queued}
        failoverStart={failoverStart}
        settled={event.type === 'down' && event.settled}
        registerCommit={registerCommit}
        onReset={reset}
      />

      <ul className='mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:hidden' aria-label='Regions'>
        {regions.map((r) => {
          const isDown = downSet.has(r.id);
          return (
            <li key={r.id}>
              <button
                type='button'
                onClick={() => toggle(r.id)}
                className={cn(
                  'flex min-h-12 w-full items-center justify-between gap-2 border border-ink px-3 text-left',
                  isDown ? 'hatch-ink bg-paper-deep' : 'bg-paper'
                )}
                aria-label={isDown ? `Bring ${r.name} back` : `Take ${r.name} down`}
              >
                <span className='flex items-baseline gap-2'>
                  <span className='annot text-ink-blue'>{r.code}</span>
                  <span className='text-[0.9375rem]'>{r.name}</span>
                </span>
                <span className='annot-xs bg-paper px-1'>{isDown ? 'Down' : 'Up'}</span>
              </button>
            </li>
          );
        })}
      </ul>

      <p className='sr-only' aria-live='polite'>
        {status.main} {status.sub ?? ''}
      </p>
    </figure>
  );
}

function statusLine(event: Event, down: RegionId[]): { main: string; sub?: string } {
  switch (event.type) {
    case 'healthy':
      return { main: copy.healthy };
    case 'down': {
      const name = regionById(event.region).name;
      if (!event.settled) return { main: fill(copy.failingOver, { region: name }) };
      if (down.length >= 2)
        return {
          main: fill(copy.failedOver, { region: name, seconds: String(replication.failoverSeconds) }),
          sub: fill(copy.twoDown, { regions: listNames(down) })
        };
      return { main: fill(copy.failedOver, { region: name, seconds: String(replication.failoverSeconds) }) };
    }
    case 'paused':
      return { main: copy.paused, sub: copy.readsContinue };
    case 'restored':
      return {
        main: fill(copy.restored, { region: regionById(event.region).name }),
        sub: down.length ? fill(copy.twoDown, { regions: listNames(down) }) : undefined
      };
    case 'resumed':
      return { main: copy.resumed };
    case 'limit':
      return { main: copy.limit, sub: copy.paused };
  }
}

function LinkPath({ link }: { link: Link }) {
  return link.kind === 'quorum' ? (
    <path d={link.d} stroke='var(--ink-blue)' strokeOpacity='0.42' vectorEffect='non-scaling-stroke' />
  ) : (
    <path
      d={link.d}
      stroke='var(--ink)'
      strokeOpacity='0.38'
      strokeDasharray='2 3'
      vectorEffect='non-scaling-stroke'
    />
  );
}

/** A new route, revealed along its length while the failover runs. */
function DrawIn({ link, ms }: { link: Link; ms: number }) {
  const id = `reveal-${link.key.replace(/[^a-z0-9-]/gi, '')}`;
  return (
    <g>
      <mask id={id} maskUnits='userSpaceOnUse' x='-10' y='-10' width='1020' height='420'>
        <path
          d={link.d}
          stroke='#fff'
          strokeWidth='10'
          fill='none'
          pathLength={1}
          strokeDasharray='1 1'
          className='sys-reveal'
          style={{ animationDuration: `${ms}ms` }}
        />
      </mask>
      <g mask={`url(#${id})`}>
        {link.kind === 'quorum' ? (
          <path d={link.d} stroke='var(--ink-blue)' strokeWidth='1.4' vectorEffect='non-scaling-stroke' />
        ) : (
          <path
            d={link.d}
            stroke='var(--ink-blue)'
            strokeWidth='1.2'
            strokeDasharray='3 2.5'
            vectorEffect='non-scaling-stroke'
          />
        )}
      </g>
    </g>
  );
}

function RegionNode({
  id,
  down,
  paused,
  onToggle
}: {
  id: RegionId;
  down: boolean;
  paused: boolean;
  onToggle: (id: RegionId) => void;
}) {
  const r = regionById(id);
  const pos = pct(regionPoint[id]);
  const labelPos: Record<typeof r.label, string> = {
    left: 'right-3.5 top-0 -translate-y-1/2 items-end text-right',
    right: 'left-3.5 top-0 -translate-y-1/2 items-start',
    above: 'bottom-3 left-0 -translate-x-1/2 items-center text-center',
    below: 'top-3 left-0 -translate-x-1/2 items-center text-center'
  };
  return (
    <div className='absolute z-10' style={pos}>
      <button
        type='button'
        onClick={() => onToggle(id)}
        aria-label={down ? `Bring ${r.name} back` : `Take ${r.name} down`}
        className='group absolute top-0 left-0 grid size-11 -translate-x-1/2 -translate-y-1/2 cursor-pointer place-items-center rounded-full'
      >
        {down ? (
          <span className='hatch-ink relative block size-[1.375rem] border border-ink bg-paper'>
            <svg viewBox='0 0 22 22' className='absolute inset-0 size-full' aria-hidden='true'>
              <path d='M0 0L22 22M22 0L0 22' stroke='var(--ink)' strokeWidth='1.25' />
            </svg>
          </span>
        ) : (
          <span
            className={cn(
              'relative grid size-[1.125rem] place-items-center rounded-full border border-ink-blue bg-paper transition-transform group-hover:scale-125',
              paused && 'border-dashed'
            )}
          >
            <span className='block size-2 rounded-full bg-ink-blue' />
          </span>
        )}
      </button>
      <span
        aria-hidden='true'
        className={cn('pointer-events-none absolute flex flex-col gap-0.5 whitespace-nowrap', labelPos[r.label])}
      >
        <span className={cn('annot leading-none', down ? 'text-ink line-through' : 'text-ink-blue')}>
          {r.code}
        </span>
        <span className='annot-xs hidden bg-paper py-px leading-none text-ink md:block'>
          {down ? 'Down' : r.name}
        </span>
      </span>
    </div>
  );
}

function Readout({
  className,
  status,
  down,
  paused,
  queued,
  failoverStart,
  settled,
  registerCommit,
  onReset
}: {
  className?: string;
  status: { main: string; sub?: string };
  down: RegionId[];
  paused: boolean;
  queued: number;
  failoverStart: number | null;
  settled: boolean;
  registerCommit: (el: HTMLElement | null) => void;
  onReset: () => void;
}) {
  return (
    <div className={cn('border border-ink bg-paper', className)}>
      <div className='border-b border-ink px-3 py-2.5'>
        <div className='annot-xs flex items-center justify-between text-ink-muted'>
          <span>{copy.status}</span>
          <UpMeter down={down} />
        </div>
        <p className={cn('mt-1.5 text-[0.9375rem] leading-snug', paused && 'font-medium')}>{status.main}</p>
        {status.sub ? <p className='mt-1 text-[0.8125rem] leading-snug text-ink-muted'>{status.sub}</p> : null}
      </div>
      <dl className='grid grid-cols-3'>
        <div className='border-r border-ink px-3 py-2'>
          <dt className='annot-xs text-ink-muted'>{copy.commits}</dt>
          <dd className='mono tnum text-[0.9375rem]'>
            <span ref={registerCommit}>0</span>
            {queued > 0 ? <span className='annot-xs ml-1.5 text-ink-blue'>+{queued} queued</span> : null}
          </dd>
        </div>
        <div className='border-r border-ink px-3 py-2'>
          <dt className='annot-xs text-ink-muted'>{copy.lost}</dt>
          <dd className='mono tnum text-[0.9375rem]'>0</dd>
        </div>
        <div className='px-3 py-2'>
          <dt className='annot-xs text-ink-muted'>{copy.failover}</dt>
          <dd className='mono tnum text-[0.9375rem]'>
            <FailoverClock start={failoverStart} settled={settled} hasDown={down.length > 0} />
          </dd>
        </div>
      </dl>
      {down.length > 0 ? (
        <button
          type='button'
          onClick={onReset}
          className='annot flex min-h-11 w-full items-center justify-center border-t border-ink text-ink-blue hover:bg-ink hover:text-paper'
        >
          {copy.reset}
        </button>
      ) : null}
    </div>
  );
}

function UpMeter({ down }: { down: RegionId[] }) {
  return (
    <span className='flex items-center gap-1' aria-label={`${regions.length - down.length} of ${regions.length} regions up`}>
      {regions.map((r) => (
        <span
          key={r.id}
          className={cn(
            'block size-2.5 border',
            down.includes(r.id) ? 'hatch-ink border-ink' : 'border-ink-blue bg-ink-blue'
          )}
        />
      ))}
      <span className='ml-1'>
        {regions.length - down.length}/{regions.length}
      </span>
    </span>
  );
}

function FailoverClock({ start, settled, hasDown }: { start: number | null; settled: boolean; hasDown: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (start === null) return;
    let raf = 0;
    const tick = () => {
      const s = Math.min((performance.now() - start) / 1000, replication.failoverSeconds);
      if (ref.current) ref.current.textContent = `${s.toFixed(1)} s`;
      if (s < replication.failoverSeconds) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start]);
  if (start !== null) return <span ref={ref}>0.0 s</span>;
  if (settled || hasDown) return <span>{replication.failoverSeconds.toFixed(1)} s</span>;
  return <span>—</span>;
}

function Legend() {
  const items = [
    { label: hero.legend.request, d: 'M0 5H26', dash: '3 2.5', stroke: 'var(--ink-blue)', w: 1.6 },
    { label: hero.legend.replicate, d: 'M0 5H26', dash: '8 3', stroke: 'var(--ink-blue)', w: 1.6 },
    { label: hero.legend.ack, d: 'M1 5H26', dash: '0 5', stroke: 'var(--ink)', w: 2.6, cap: 'round' as const }
  ];
  return (
    <ul className='annot-xs mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-ink md:mx-7' aria-label='Legend'>
      {items.map((i) => (
        <li key={i.label} className='flex items-center gap-2'>
          <svg width='26' height='10' aria-hidden='true'>
            <path d={i.d} stroke={i.stroke} strokeWidth={i.w} strokeDasharray={i.dash} strokeLinecap={i.cap} />
          </svg>
          {i.label}
        </li>
      ))}
      <li className='flex items-center gap-2'>
        <svg width='14' height='14' aria-hidden='true'>
          <circle cx='7' cy='7' r='5.5' fill='none' stroke='var(--ink-blue)' />
        </svg>
        {hero.legend.commit}
      </li>
      <li className='flex items-center gap-2'>
        <svg width='10' height='10' aria-hidden='true'>
          <circle cx='5' cy='5' r='2' fill='var(--ink)' />
        </svg>
        Client city
      </li>
      <li className='flex items-center gap-2'>
        <span className='hatch-ink block size-3 border border-ink' aria-hidden='true' />
        Region down
      </li>
    </ul>
  );
}

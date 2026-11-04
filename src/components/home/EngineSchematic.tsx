import { Link } from '@tanstack/react-router';
import { useEffect, useRef, type CSSProperties, type ReactNode, type RefObject } from 'react';
import { Sheet, sheetPad } from '~/components/blueprint/Sheet';
import { engine } from '~/content/home';
import { Arrow } from './Hero';

// Dimetric projection of a 260 × 260 plate: x' = 0.9(x − y), y' = 0.32(x + y).
const S = 260;
const A = 0.9;
const B = 0.32;
const T = 24; // plate thickness
const W = S * A; // half width of the drawing: 234
const H = S * B * 2; // top face height: 166.4
const plane = `matrix(${A} ${B} ${-A} ${B} 0 0)`;

// Desktop layout, in CSS px. The plates are drawn at 85 % so the drawing,
// its callouts and the height dimension fit a 640 px column.
const K = 0.85;
const STEP = T * K; // plate offset when assembled
const GAP = 92; // extra offset per plate when fully apart
const DIM = 44; // room for the height dimension on the left
const CX = DIM + 10 + W * K; // centre line of the stack
const TOP = 24; // first plate's top edge
const lastTop = TOP + 3 * (STEP + GAP);
const STACK_H = Math.ceil(lastTop + (H + T + 12) * K + 24);

const faces = {
  top: `M0 0L${W} ${H / 2}L0 ${H}L${-W} ${H / 2}Z`,
  left: `M${-W} ${H / 2}L0 ${H}V${H + T}L${-W} ${H / 2 + T}Z`,
  right: `M0 ${H}L${W} ${H / 2}V${H / 2 + T}L0 ${H + T}Z`
};

export function EngineSchematic() {
  const ref = useRef<HTMLDivElement>(null);
  useExplode(ref);

  return (
    <Sheet id={engine.id} meta={engine.sheet} eyebrow={engine.eyebrow} labelledBy='engine-title'>
      <div className={`grid gap-6 pt-10 pb-4 lg:grid-cols-12 ${sheetPad}`}>
        <h2 id='engine-title' className='heading text-[2rem] sm:text-[2.75rem] lg:col-span-6'>
          {engine.headline}
        </h2>
        <p className='body-copy self-end lg:col-span-5 lg:col-start-8'>{engine.intro}</p>
      </div>

      <div className={`grid gap-10 pb-10 xl:grid-cols-12 ${sheetPad}`}>
        <figure className='xl:col-span-7'>
          <figcaption className='annot pb-3'>{engine.figure}</figcaption>

          {/* Desktop: the stack separates as it scrolls into view. */}
          <div
            ref={ref}
            className='engine-stack relative mx-auto hidden w-[640px] max-w-full md:block xl:mx-0'
            style={
              { '--e': 0, '--step': `${STEP}px`, '--gap': `${GAP}px`, height: STACK_H } as CSSProperties
            }
          >
            <svg
              className='absolute top-0 h-full w-px overflow-visible'
              style={{ left: CX }}
              aria-hidden='true'
            >
              <line
                x1='0'
                x2='0'
                y1='0'
                y2={STACK_H}
                stroke='var(--ink)'
                strokeDasharray='16 4 2 4'
                strokeOpacity='0.6'
              />
            </svg>
            {engine.layers.map((layer, i) => (
              <div
                key={layer.name}
                className='engine-layer absolute'
                style={{ '--i': i, zIndex: 10 - i, top: TOP, left: CX } as CSSProperties}
              >
                <Plate index={i} />
                <div
                  className='engine-label absolute flex -translate-y-1/2 items-center'
                  style={{ top: (4 + H / 2 + T / 2) * K, left: W * K + 10 }}
                >
                  <span className='h-px w-8 bg-ink' aria-hidden='true' />
                  <span className='callout -ml-px text-ink'>{i + 1}</span>
                  <span className='ml-2.5 whitespace-nowrap'>
                    <span className='annot block text-ink'>{layer.name}</span>
                    <span className='annot-xs block text-ink-blue'>{layer.spec}</span>
                  </span>
                </div>
              </div>
            ))}
            <DimensionV />
          </div>

          {/* Phones: drawn already separated. */}
          <ol className='space-y-2 md:hidden' aria-label='Engine layers'>
            {engine.layers.map((layer, i) => (
              <li key={layer.name} className='relative'>
                <svg
                  viewBox={`${-W - 4} -4 ${W * 2 + 8} ${H + T + 8}`}
                  className='mx-auto block w-[82%]'
                  aria-hidden='true'
                >
                  <PlateShape index={i} />
                </svg>
                <div className='mt-1 flex items-center justify-center gap-2'>
                  <span className='callout'>{i + 1}</span>
                  <span className='annot'>{layer.name}</span>
                  <span className='annot-xs text-ink-blue'>· {layer.spec}</span>
                </div>
              </li>
            ))}
          </ol>
        </figure>

        <ol className='self-center border-t border-ink md:grid md:grid-cols-2 md:gap-x-10 xl:col-span-5 xl:block'>
          {engine.layers.map((layer, i) => (
            <li key={layer.name} className='grid grid-cols-[2.25rem_1fr] gap-x-3 border-b border-ink py-5'>
              <span className='callout mt-0.5'>{i + 1}</span>
              <div>
                <h3 className='heading text-[1.25rem]'>
                  {layer.name}
                  <span className='annot-xs ml-3 align-middle text-ink-blue'>{layer.spec}</span>
                </h3>
                <p className='body-copy mt-1.5'>{layer.text}</p>
              </div>
            </li>
          ))}
          <li className='pt-5 md:col-span-2'>
            <Link to='/architecture' className='link inline-flex min-h-11 items-center gap-3'>
              {engine.readMore}
              <Arrow />
            </Link>
          </li>
        </ol>
      </div>
    </Sheet>
  );
}

function Plate({ index }: { index: number }) {
  return (
    <svg
      width={(W * 2 + 8) * K}
      height={(H + T + 8) * K}
      viewBox={`${-W - 4} -4 ${W * 2 + 8} ${H + T + 8}`}
      className='absolute top-0 -translate-x-1/2'
      aria-hidden='true'
    >
      <PlateShape index={index} />
    </svg>
  );
}

function PlateShape({ index }: { index: number }) {
  return (
    <g>
      <path d={faces.left} fill='var(--paper)' />
      <path d={faces.left} fill='url(#hatch-blue)' {...edge} />
      <path d={faces.right} fill='var(--paper)' />
      <path d={faces.right} fill='url(#hatch-blue)' {...edge} />
      <path d={faces.top} fill='var(--paper)' {...edge} />
      <g transform={plane}>{details[index]}</g>
    </g>
  );
}

const edge = {
  stroke: 'var(--ink)',
  strokeWidth: 1,
  vectorEffect: 'non-scaling-stroke' as const
};

const stroke = {
  fill: 'none',
  stroke: 'var(--ink-blue)',
  strokeWidth: 1,
  vectorEffect: 'non-scaling-stroke' as const
};

/** What each plate carries on its top face, drawn in plate coordinates. */
const details: ReactNode[] = [
  // 1 SQL layer: a grid of client sessions around a parser.
  <g key='sql'>
    {Array.from({ length: 5 }, (_row, r) =>
      Array.from({ length: 5 }, (_col, c) => (
        <rect
          key={`${r}-${c}`}
          x={30 + c * 42}
          y={30 + r * 42}
          width='28'
          height='28'
          {...stroke}
          fill={(r * 5 + c) % 7 === 0 ? 'var(--ink-blue)' : 'none'}
        />
      ))
    )}
  </g>,
  // 2 Planner: a plan tree.
  <g key='plan'>
    <path d='M130 40V90M130 90L70 140M130 90L190 140M70 140L40 205M70 140L100 205M190 140L160 205M190 140L220 205' {...stroke} />
    {[
      [130, 40],
      [130, 90],
      [70, 140],
      [190, 140],
      [40, 205],
      [100, 205],
      [160, 205],
      [220, 205]
    ].map(([x, y], i) => (
      <rect key={i} x={x - 11} y={y - 11} width='22' height='22' {...stroke} fill={i === 1 ? 'var(--ink-blue)' : 'var(--paper)'} />
    ))}
  </g>,
  // 3 Replication log: entries, committed ones filled, and the commit index.
  <g key='log'>
    {[0, 1, 2].map((row) => (
      <g key={row}>
        {Array.from({ length: 9 }, (_, i) => (
          <rect
            key={i}
            x={22 + i * 25}
            y={52 + row * 62}
            width='19'
            height='38'
            {...stroke}
            fill={i < 6 - row ? 'var(--ink-blue)' : 'none'}
          />
        ))}
      </g>
    ))}
    <path d='M172 30V230' {...stroke} strokeDasharray='6 4' />
  </g>,
  // 4 Storage: LSM levels growing downward.
  <g key='lsm'>
    {[1, 2, 4, 8].map((n, level) => (
      <g key={n}>
        {Array.from({ length: n }, (_, i) => {
          const w = 216 / n;
          return (
            <rect
              key={i}
              x={22 + i * w + 2}
              y={30 + level * 52}
              width={w - 4}
              height='36'
              {...stroke}
              fill={level === 0 ? 'var(--ink-blue)' : 'none'}
            />
          );
        })}
      </g>
    ))}
  </g>
];

/** Overall height dimension, shown once the stack is apart. */
function DimensionV() {
  const y1 = TOP + 4 * K;
  const y2 = lastTop + (4 + H + T) * K;
  return (
    <div className='engine-label absolute inset-y-0 left-0 z-20 w-11' aria-hidden='true'>
      <svg width={DIM} height='100%' className='overflow-visible'>
        <line x1='20' x2='20' y1={y1 + 1} y2={y2 - 1} stroke='var(--ink)' markerStart='url(#arrow-ink)' markerEnd='url(#arrow-ink)' />
        <line x1='8' x2={DIM} y1={y1} y2={y1} stroke='var(--ink)' strokeOpacity='0.5' />
        <line x1='8' x2={DIM} y1={y2} y2={y2} stroke='var(--ink)' strokeOpacity='0.5' />
      </svg>
      <span
        className='annot-xs absolute left-5 -translate-x-1/2 -translate-y-1/2 rotate-180 bg-paper px-0.5 py-2 whitespace-nowrap text-ink [writing-mode:vertical-rl]'
        style={{ top: (y1 + y2) / 2 }}
      >
        1 binary · 4 layers
      </span>
    </div>
  );
}

function useExplode(ref: RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reduced.matches) {
      el.style.setProperty('--e', '1');
      return;
    }
    let raf = 0;
    let active = false;
    const smooth = (t: number) => {
      const x = Math.min(1, Math.max(0, t));
      return x * x * (3 - 2 * x);
    };
    const update = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh - r.top) / (vh + r.height);
      const e = smooth((p - 0.12) / 0.26) * (1 - smooth((p - 0.74) / 0.2));
      el.style.setProperty('--e', e.toFixed(3));
    };
    const onScroll = () => {
      if (active && !raf) raf = requestAnimationFrame(update);
    };
    const io = new IntersectionObserver(([entry]) => {
      active = entry.isIntersecting;
      if (active) onScroll();
    });
    io.observe(el);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [ref]);
}

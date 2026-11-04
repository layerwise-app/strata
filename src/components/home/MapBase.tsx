import type { ReactNode, Ref } from 'react';
import { MAP } from '~/lib/geo';

const meridians = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
const parallels = [60, 30, 0, -30];

/**
 * The world drawing every map shares: graticule, dotted Natural Earth land
 * outline, and whatever routes the figure adds as children.
 */
export function MapBase({
  children,
  svgRef,
  title
}: {
  children?: ReactNode;
  svgRef?: Ref<SVGSVGElement>;
  title: string;
}) {
  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${MAP.width} ${MAP.height}`}
      className='absolute inset-0 h-full w-full overflow-hidden'
      role='img'
      aria-label={title}
    >
      <g stroke='var(--ink-blue)' strokeOpacity='0.16' strokeWidth='1'>
        {meridians.map((lon) => {
          const x = ((lon + 180) / 360) * MAP.width;
          return (
            <line key={lon} x1={x} x2={x} y1={0} y2={MAP.height} vectorEffect='non-scaling-stroke' />
          );
        })}
        {parallels.map((lat) => {
          const y = (MAP.north - lat) / MAP.degPerUnit;
          return (
            <line
              key={lat}
              x1={0}
              x2={MAP.width}
              y1={y}
              y2={y}
              vectorEffect='non-scaling-stroke'
              strokeDasharray={lat === 0 ? '6 4' : undefined}
              strokeOpacity={lat === 0 ? 0.3 : undefined}
            />
          );
        })}
      </g>
      <use
        href='/world.svg#land'
        width={MAP.width}
        height={MAP.height}
        fill='none'
        stroke='var(--ink-blue)'
        strokeOpacity='0.62'
        strokeWidth='1.35'
        strokeDasharray='0 3.1'
        strokeLinecap='round'
      />
      {children}
    </svg>
  );
}

/** Degree labels around a map frame; decorative, hidden on small screens. */
export function MapDegrees() {
  return (
    <div aria-hidden='true' className='pointer-events-none absolute inset-0 hidden md:block'>
      {parallels.map((lat) => (
        <span
          key={lat}
          className='annot-xs absolute -left-1 -translate-x-full -translate-y-1/2 pr-1 text-ink-muted'
          style={{ top: `${((MAP.north - lat) / MAP.degPerUnit / MAP.height) * 100}%` }}
        >
          {lat === 0 ? '0°' : `${Math.abs(lat)}°${lat > 0 ? 'N' : 'S'}`}
        </span>
      ))}
      {meridians
        .filter((lon) => lon % 60 === 0)
        .map((lon) => (
          <span
            key={lon}
            className='annot-xs absolute -bottom-1 -translate-x-1/2 translate-y-full pt-1 text-ink-muted'
            style={{ left: `${((lon + 180) / 360) * 100}%` }}
          >
            {lon === 0 ? '0°' : `${Math.abs(lon)}°${lon > 0 ? 'E' : 'W'}`}
          </span>
        ))}
    </div>
  );
}

/** Percent position of a map point inside its frame, for HTML overlays. */
export function pct(p: { x: number; y: number }) {
  return { left: `${(p.x / MAP.width) * 100}%`, top: `${(p.y / MAP.height) * 100}%` };
}

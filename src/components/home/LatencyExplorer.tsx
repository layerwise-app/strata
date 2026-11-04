import { useId, useMemo, useState } from 'react';
import { Sheet, sheetPad } from '~/components/blueprint/Sheet';
import { latency } from '~/content/home';
import {
  cities,
  defaultCityId,
  measurement,
  regionById,
  regions,
  replication,
  servingRegion,
  type City,
  type Percentiles
} from '~/content/topology';
import { distanceKm, linePath, project } from '~/lib/geo';
import { cn } from '~/lib/utils';
import { MapBase, pct } from './MapBase';

type RowKey = 'readP50' | 'readP99' | 'writeP50' | 'writeP99';
const rowDefs: { key: RowKey; op: 'read' | 'write'; p: keyof Percentiles }[] = [
  { key: 'readP50', op: 'read', p: 'p50' },
  { key: 'readP99', op: 'read', p: 'p99' },
  { key: 'writeP50', op: 'write', p: 'p50' },
  { key: 'writeP99', op: 'write', p: 'p99' }
];

export function LatencyExplorer() {
  const [cityId, setCityId] = useState(defaultCityId);
  const city = cities.find((c) => c.id === cityId) ?? cities[0];
  const groupName = useId();

  return (
    <Sheet id={latency.id} meta={latency.sheet} eyebrow={latency.eyebrow} labelledBy='latency-title'>
      <div className={`grid gap-6 pt-10 pb-8 lg:grid-cols-12 ${sheetPad}`}>
        <h2 id='latency-title' className='heading text-[2rem] sm:text-[2.75rem] lg:col-span-6'>
          {latency.headline}
        </h2>
        <p className='body-copy self-end lg:col-span-5 lg:col-start-8'>{latency.intro}</p>
      </div>

      <div className={`grid gap-8 pb-10 lg:grid-cols-12 lg:gap-10 ${sheetPad}`}>
        <fieldset className='lg:col-span-3'>
          <legend className='annot mb-3 text-ink-muted'>{latency.cityLabel}</legend>
          <div className='grid grid-cols-2 border-t border-l border-ink sm:grid-cols-3 lg:grid-cols-1'>
            {cities.map((c) => {
              const r = servingRegion(c);
              const checked = c.id === city.id;
              return (
                <label
                  key={c.id}
                  className={cn(
                    'relative flex min-h-11 cursor-pointer items-center justify-between gap-2 border-r border-b border-ink px-3 py-2 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-[-3px] has-[:focus-visible]:outline-ink-blue',
                    checked ? 'bg-ink text-paper' : 'bg-paper hover:bg-paper-deep'
                  )}
                >
                  <input
                    type='radio'
                    name={groupName}
                    value={c.id}
                    checked={checked}
                    onChange={() => setCityId(c.id)}
                    className='sr-only'
                  />
                  <span className='min-w-0'>
                    <span className='block truncate text-[0.9375rem] leading-tight'>{c.name}</span>
                    <span className={cn('annot-xs hidden lg:block', checked ? 'text-paper/75' : 'text-ink-muted')}>
                      {c.country}
                    </span>
                  </span>
                  <span className={cn('annot-xs', checked ? 'text-paper' : 'text-ink-blue')}>
                    {r ? regionById(r).code : ''}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        <div className='min-w-0 lg:col-span-9'>
          <RouteFigure city={city} onPick={setCityId} />
          <LatencyTable city={city} />
          <ul className='annot-xs mt-4 space-y-1 text-ink-muted'>
            <li>{measurement.read}</li>
            <li>{measurement.write}</li>
            <li>{measurement.method}</li>
          </ul>
        </div>
      </div>
    </Sheet>
  );
}

function RouteFigure({ city, onPick }: { city: City; onPick: (id: string) => void }) {
  const serving = servingRegion(city) ?? 'vir';
  const single = replication.singleRegion;
  const cp = project(city.lat, city.lon);
  const sp = project(regionById(serving).lat, regionById(serving).lon);
  const vp = project(regionById(single).lat, regionById(single).lon);
  const km = Math.round(distanceKm(city.lat, city.lon, regionById(serving).lat, regionById(serving).lon) / 10) * 10;
  const kmSingle = Math.round(distanceKm(city.lat, city.lon, regionById(single).lat, regionById(single).lon) / 10) * 10;
  const sameRegion = serving === single;

  return (
    <figure>
      <figcaption className='flex flex-wrap items-baseline justify-between gap-2 pb-3'>
        <span className='annot'>{latency.figure.replace('{city}', city.name)}</span>
        <span className='annot text-ink-muted'>
          {latency.servedBy} {regionById(serving).name} · {km.toLocaleString('en-US')} km ·{' '}
          {city.rttMs[serving]} ms RTT
        </span>
      </figcaption>
      <div className='relative aspect-[5/2] w-full border border-ink bg-paper'>
        <MapBase title={`Route from ${city.name} to ${regionById(serving).name}`}>
          {!sameRegion ? (
            <path
              d={linePath(cp, vp)}
              fill='none'
              stroke='var(--ink)'
              strokeWidth='1'
              strokeDasharray='5 4'
              strokeOpacity='0.7'
              vectorEffect='non-scaling-stroke'
            />
          ) : null}
          <path
            key={city.id}
            d={linePath(cp, sp)}
            fill='none'
            stroke='var(--ink-blue)'
            strokeWidth='2'
            vectorEffect='non-scaling-stroke'
            className='lat-route'
            pathLength={1}
          />
          <g stroke='var(--ink)' strokeOpacity='0.45' strokeWidth='4' strokeLinecap='round'>
            {cities.map((c) => {
              const p = project(c.lat, c.lon);
              return <path key={c.id} d={`M${p.x} ${p.y}h0`} vectorEffect='non-scaling-stroke' />;
            })}
          </g>
        </MapBase>

        {/* Regions */}
        {regions.map((r) => {
          const p = project(r.lat, r.lon);
          const active = r.id === serving;
          const isSingle = r.id === single;
          // Keep the serving label clear of a route that leaves to the right.
          const dx = cp.x - p.x;
          const labelLeft = active && dx > 0 && Math.abs(cp.y - p.y) < dx * 0.7;
          return (
            <div key={r.id} className='pointer-events-none absolute' style={pct(p)}>
              <span
                className={cn(
                  'absolute top-0 left-0 block -translate-x-1/2 -translate-y-1/2 rounded-full border',
                  active
                    ? 'size-4 border-ink-blue bg-ink-blue'
                    : 'size-2.5 border-ink-blue bg-paper'
                )}
              />
              <span
                className={cn(
                  'annot-xs absolute top-0 -translate-y-1/2 whitespace-nowrap',
                  labelLeft ? 'right-2.5 pr-1.5' : 'left-2.5 pl-1',
                  active ? 'text-ink-blue' : 'text-ink-muted',
                  !active && !isSingle && 'hidden sm:inline'
                )}
              >
                {r.code}
                {isSingle && !active ? (
                  <span className='hidden sm:inline'> · single region</span>
                ) : null}
              </span>
            </div>
          );
        })}

        {/* City picks on the map (the list is the keyboard path). */}
        {cities.map((c) => {
          const p = project(c.lat, c.lon);
          return (
            <button
              key={c.id}
              type='button'
              tabIndex={-1}
              aria-hidden='true'
              onClick={() => onPick(c.id)}
              className='absolute size-8 -translate-x-1/2 -translate-y-1/2 cursor-pointer'
              style={pct(p)}
            />
          );
        })}

        {/* Selected city: crosshair target and label. */}
        <div className='pointer-events-none absolute' style={pct(cp)}>
          <svg
            width='34'
            height='34'
            viewBox='0 0 34 34'
            className='absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2'
            aria-hidden='true'
          >
            <circle cx='17' cy='17' r='9' fill='none' stroke='var(--ink)' />
            <path d='M17 0V11M17 23V34M0 17H11M23 17H34' stroke='var(--ink)' />
          </svg>
          <span
            className={cn(
              'absolute top-3 whitespace-nowrap',
              cp.x > 820 ? 'right-3 text-right' : 'left-3'
            )}
          >
            <span className='annot block bg-paper px-1 text-ink'>{city.name}</span>
          </span>
        </div>
      </div>
      <div className='annot-xs mt-2 flex flex-wrap gap-x-6 gap-y-1 text-ink-muted'>
        <span className='flex items-center gap-2'>
          <svg width='24' height='6' aria-hidden='true'>
            <path d='M0 3H24' stroke='var(--ink-blue)' strokeWidth='2' />
          </svg>
          Strata: nearest copy, {regionById(serving).name}
        </span>
        {!sameRegion ? (
          <span className='flex items-center gap-2'>
            <svg width='24' height='6' aria-hidden='true'>
              <path d='M0 3H24' stroke='var(--ink)' strokeDasharray='5 4' />
            </svg>
            Single region: Virginia, {kmSingle.toLocaleString('en-US')} km
          </span>
        ) : (
          <span>This city is already next to the single region.</span>
        )}
      </div>
    </figure>
  );
}

function LatencyTable({ city }: { city: City }) {
  const serving = servingRegion(city) ?? 'vir';
  const max = useMemo(
    () => Math.max(city.latency.single.write.p99, city.latency.strata.write.p99),
    [city]
  );
  return (
    <>
    <dl className='mt-6 border border-ink md:hidden'>
      {rowDefs.map((row) => {
        const s = city.latency.single[row.op][row.p];
        const t = city.latency.strata[row.op][row.p];
        return (
          <div key={row.key} className='border-b border-ink px-3 py-3 last:border-b-0'>
            <dt className='annot'>{latency.rows[row.key]}</dt>
            <dd className='mt-2 grid grid-cols-2 gap-3'>
              <span>
                <span className='annot-xs block text-ink-muted'>
                  {latency.singleLabel} · {latency.singleSub}
                </span>
                <span className='mono tnum text-[1.0625rem]'>
                  {s} <span className='text-ink-muted'>ms</span>
                </span>
              </span>
              <span>
                <span className='annot-xs block text-ink-muted'>
                  {latency.strataLabel} · {regionById(serving).code}
                </span>
                <span className='mono tnum text-[1.0625rem] text-ink-blue'>
                  {t} <span className='text-ink-muted'>ms</span>
                </span>
              </span>
            </dd>
            <dd className='mt-1'>
              <DiffDimension single={s} strata={t} max={max} />
            </dd>
          </div>
        );
      })}
    </dl>
    <table className='mt-6 hidden w-full border-collapse border border-ink text-left md:table'>
      <caption className='sr-only'>
        Latency from {city.name} in milliseconds, single region in Virginia versus Strata
      </caption>
      <thead>
        <tr className='annot-xs text-ink-muted'>
          <th scope='col' className='border-b border-ink px-3 py-2 font-medium'>
            <span className='sr-only'>Measure</span>
          </th>
          <th scope='col' className='border-b border-l border-ink px-3 py-2 font-medium'>
            {latency.singleLabel}
            <span className='block text-ink'>{latency.singleSub}</span>
          </th>
          <th scope='col' className='border-b border-l border-ink px-3 py-2 font-medium'>
            {latency.strataLabel}
            <span className='block text-ink-blue'>{regionById(serving).name}</span>
          </th>
          <th scope='col' className='border-b border-l border-ink px-3 py-2 font-medium'>
            {latency.differenceLabel}
          </th>
        </tr>
      </thead>
      <tbody>
        {rowDefs.map((row) => {
          const s = city.latency.single[row.op][row.p];
          const t = city.latency.strata[row.op][row.p];
          return (
            <tr key={row.key} className='border-b border-ink last:border-b-0'>
              <th scope='row' className='annot px-3 py-3 font-medium whitespace-nowrap'>
                {latency.rows[row.key]}
              </th>
              <td className='mono tnum border-l border-ink px-3 py-3 text-[1.0625rem]'>
                {s} <span className='text-ink-muted'>ms</span>
              </td>
              <td className='mono tnum border-l border-ink px-3 py-3 text-[1.0625rem] text-ink-blue'>
                {t} <span className='text-ink-muted'>ms</span>
              </td>
              <td className='w-[46%] border-l border-ink px-3 py-2'>
                <DiffDimension single={s} strata={t} max={max} />
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
    </>
  );
}

/** The difference drawn as a dimension line between the two values. */
function DiffDimension({ single, strata, max }: { single: number; strata: number; max: number }) {
  const at = (v: number) => (v / max) * 100;
  const ps = at(single);
  const pt = at(strata);
  const diff = strata - single;
  const ratio = strata > 0 ? single / strata : 0;
  const label = diff === 0 ? latency.same : diff < 0 ? `−${Math.abs(diff)} ms` : `+${diff} ms`;
  const note =
    diff === 0
      ? ''
      : diff < 0
        ? ratio >= 1.1
          ? `${ratio.toFixed(ratio >= 10 ? 0 : 1)}× ${latency.faster}`
          : latency.faster
        : latency.slower;
  const left = Math.min(ps, pt);
  const width = Math.abs(ps - pt);
  return (
    <div className='flex items-center gap-3'>
      <div className='relative mx-1 h-[34px] min-w-0 flex-1' aria-hidden='true'>
        <span className='absolute right-0 bottom-[7px] left-0 h-px bg-ink/25' />
        <span className='lat-move absolute bottom-[2px] block h-5 w-px bg-ink' style={{ left: `${ps}%` }} />
        <span
          className='lat-move absolute bottom-[2px] block h-5 w-[2px] -translate-x-1/2 bg-ink-blue'
          style={{ left: `${pt}%` }}
        />
        {diff !== 0 ? (
          <span
            className='lat-move absolute bottom-[16px] block h-px bg-ink'
            style={{ left: `${left}%`, width: `${width}%` }}
          >
            {width > 5 ? (
              <>
                <svg width='8' height='6' viewBox='0 0 8 6' className='absolute top-1/2 left-0 -translate-y-1/2'>
                  <path d='M0 3L8 0V6Z' fill='var(--ink)' />
                </svg>
                <svg width='8' height='6' viewBox='0 0 8 6' className='absolute top-1/2 right-0 -translate-y-1/2'>
                  <path d='M8 3L0 0V6Z' fill='var(--ink)' />
                </svg>
              </>
            ) : null}
          </span>
        ) : null}
      </div>
      <span className='w-[6.5rem] flex-none text-right'>
        <span className={cn('mono tnum block text-[0.875rem] leading-tight', diff < 0 ? 'text-ink-blue' : 'text-ink')}>
          {label}
        </span>
        {note ? <span className='annot-xs block text-ink-muted'>{note}</span> : null}
      </span>
    </div>
  );
}

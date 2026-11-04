import { Link } from '@tanstack/react-router';
import { Sheet, sheetPad } from '~/components/blueprint/Sheet';
import { SiteLink } from '~/components/site/SiteLink';
import { hero } from '~/content/home';
import { regions, replication } from '~/content/topology';
import { siteConfig } from '~/site.config';
import { SystemDrawing } from './SystemDrawing';

export function Hero() {
  return (
    <Sheet id={hero.id} meta={hero.sheet} eyebrow={hero.eyebrow} labelledBy='hero-title' className='pt-6 sm:pt-8'>
      <div className={`grid gap-8 pt-8 pb-8 sm:pt-10 lg:grid-cols-12 lg:gap-x-10 lg:gap-y-7 ${sheetPad}`}>
        <h1
          id='hero-title'
          className='display text-[2.6rem] sm:text-[3.5rem] lg:col-span-12 lg:max-w-[18ch] lg:text-[4.4rem] xl:max-w-none'
        >
          {hero.headline}
        </h1>
        <div className='lg:col-span-7'>
          <p className='lede max-w-[40rem]'>{hero.subhead}</p>
          <div className='mt-8 flex flex-wrap gap-3'>
            <SiteLink href={siteConfig.cta.href} className='btn btn-primary'>
              {siteConfig.cta.primary}
              <Arrow />
            </SiteLink>
            <Link to='/architecture' className='btn btn-secondary'>
              {siteConfig.cta.secondary}
            </Link>
          </div>
        </div>
        <dl className='grid grid-cols-3 self-end border border-ink lg:col-span-5 lg:col-start-8 lg:grid-cols-1 xl:col-span-4 xl:col-start-9'>
          <Fact label='Regions' value={String(regions.length)} note='Full copy in each' />
          <Fact label='Commit' value={`${replication.commitQuorum} of ${regions.length}`} note='Regions per write' />
          <Fact label='Failover' value={`${replication.failoverSeconds} s`} note='Median, no writes lost' last />
        </dl>
      </div>
      <div className={`pb-8 sm:pb-10 ${sheetPad}`}>
        <SystemDrawing />
      </div>
    </Sheet>
  );
}

function Fact({ label, value, note, last }: { label: string; value: string; note: string; last?: boolean }) {
  return (
    <div
      className={`flex flex-col justify-between gap-1 px-3 py-3 sm:px-4 lg:flex-row lg:items-baseline ${
        last ? '' : 'border-r border-ink lg:border-r-0 lg:border-b'
      }`}
    >
      <dt className='annot-xs text-ink-muted lg:w-20'>{label}</dt>
      <dd className='flex flex-col lg:flex-1 lg:flex-row lg:items-baseline lg:justify-between lg:gap-3'>
        <span className='heading tnum text-[1.5rem] sm:text-[1.875rem]'>{value}</span>
        <span className='annot-xs text-ink-muted lg:whitespace-nowrap'>{note}</span>
      </dd>
    </div>
  );
}

export function Arrow() {
  return (
    <svg width='16' height='10' viewBox='0 0 16 10' aria-hidden='true' className='-mr-1'>
      <path d='M0 5H14M10 1L14 5L10 9' fill='none' stroke='currentColor' strokeWidth='1.25' />
    </svg>
  );
}

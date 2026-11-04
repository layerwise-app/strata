import { Sheet, sheetPad } from '~/components/blueprint/Sheet';
import { ScreenSlot } from '~/components/screens/ScreenSlot';
import { caseStudy } from '~/content/home';

export function CaseStudy() {
  return (
    <Sheet id={caseStudy.id} meta={caseStudy.sheet} eyebrow={caseStudy.eyebrow} labelledBy='case-title'>
      <div className={`grid gap-10 pt-10 pb-10 lg:grid-cols-12 ${sheetPad}`}>
        <div className='lg:col-span-6'>
          <div className='flex items-center gap-4'>
            <PinecartWordmark />
            <span className='annot-xs text-ink-muted'>{caseStudy.customerNote}</span>
          </div>
          <h2 id='case-title' className='heading mt-6 text-[2rem] sm:text-[2.5rem]'>
            {caseStudy.headline}
          </h2>
          {caseStudy.body.map((p) => (
            <p key={p} className='body-copy mt-4 max-w-[36rem]'>
              {p}
            </p>
          ))}
        </div>
        <blockquote className='self-end border-l-2 border-ink-blue pl-6 lg:col-span-5 lg:col-start-8'>
          <p className='text-[1.375rem] leading-[1.4] tracking-[-0.01em] sm:text-[1.5rem]'>
            “{caseStudy.quote}”
          </p>
          <footer className='mt-4'>
            <span className='block text-[0.9375rem] font-[520]'>{caseStudy.quoteBy}</span>
            <span className='annot-xs text-ink-muted'>{caseStudy.quoteRole}</span>
          </footer>
        </blockquote>
      </div>

      <div className={`pb-10 ${sheetPad}`}>
        <dl className='grid border-t border-l border-ink md:grid-cols-3'>
          {caseStudy.stats.map((stat, i) => (
            <div key={stat.label} className='border-r border-b border-ink'>
              <dt className='flex items-center gap-3 border-b border-rule px-4 py-3'>
                <span className='callout'>{i + 1}</span>
                <span className='annot'>{stat.label}</span>
              </dt>
              <dd className='grid grid-cols-[1fr_auto_1fr] items-end gap-3 px-4 py-5'>
                <span>
                  <span className='annot-xs block text-ink-muted'>{caseStudy.beforeLabel}</span>
                  <span className='heading tnum block text-[1.5rem] text-ink-muted line-through decoration-1 sm:text-[1.75rem]'>
                    {stat.before}
                  </span>
                </span>
                <svg width='30' height='10' viewBox='0 0 30 10' className='mb-3' aria-hidden='true'>
                  <path d='M0 5H28' stroke='var(--ink)' markerEnd='url(#arrow-ink)' />
                </svg>
                <span>
                  <span className='annot-xs block text-ink-muted'>{caseStudy.afterLabel}</span>
                  <span className='heading tnum block text-[1.75rem] text-ink-blue sm:text-[2.125rem]'>
                    {stat.after}
                  </span>
                </span>
              </dd>
            </div>
          ))}
        </dl>
        <div className='mt-10'>
          <ScreenSlot name='console' caption={caseStudy.screen.caption} />
        </div>
      </div>
    </Sheet>
  );
}

/** Fictional customer wordmark, drawn in SVG. */
function PinecartWordmark() {
  return (
    <svg width='132' height='30' viewBox='0 0 132 30' role='img' aria-label={caseStudy.customer}>
      <g fill='none' stroke='var(--ink)' strokeWidth='1.6' strokeLinejoin='round'>
        <path d='M3 20L12 4L21 20Z' />
        <path d='M7 14H17' />
        <path d='M1 20H24L22 24H4Z' fill='var(--ink)' />
        <circle cx='7' cy='27.5' r='1.6' fill='var(--ink)' stroke='none' />
        <circle cx='19' cy='27.5' r='1.6' fill='var(--ink)' stroke='none' />
      </g>
      <text
        x='31'
        y='22'
        fill='var(--ink)'
        style={{ fontFamily: 'var(--font-sans-stack)', fontSize: 21, fontWeight: 640, letterSpacing: '-0.03em' }}
      >
        pinecart
      </text>
    </svg>
  );
}

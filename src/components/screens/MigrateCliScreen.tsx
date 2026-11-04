import { regions } from '~/content/topology';

const steps = [
  { mark: 'done', name: 'mirror', state: 'caught up', detail: 'lag 0.0 s · 1.84 TB copied' },
  { mark: 'done', name: 'shadow', state: '14 days', detail: '2,104,882,113 reads compared · 0 mismatches' },
  { mark: 'now', name: 'cutover', state: 'draining source', detail: 'writes paused 12.4 s', progress: 0.74 }
];

/** Drawn screen: the cutover command, mid-run. */
export function MigrateCliScreen() {
  return (
    <div
      className='mono overflow-hidden border border-ink bg-paper text-[0.75rem] leading-[1.6] sm:text-[0.8125rem]'
      role='img'
      aria-label='Terminal running strata migrate cutover: mirror caught up, 14 days of shadow reads with no mismatches, cutover draining the source with writes paused for 12.4 seconds, all six regions ready.'
    >
      <div className='flex h-9 items-center justify-between border-b border-ink px-3'>
        <span className='annot-xs'>tty · pinecart-ops</span>
        <span className='annot-xs text-ink-muted'>strata 0.9.6</span>
      </div>
      <div className='overflow-x-auto px-4 py-4'>
        <div className='min-w-[34rem]'>
          <p>
            <span className='text-ink-blue'>$</span> strata migrate cutover --from pg-primary.pinecart.internal --to pinecart-prod
          </p>
          <div className='mt-3 grid grid-cols-[5rem_1fr] text-ink-muted'>
            <span>source</span>
            <span className='text-ink'>postgres 16.4 · pg-primary (Virginia) · lsn 3F/A91C2E08</span>
            <span>target</span>
            <span className='text-ink'>strata 0.9.6 · pinecart-prod · {regions.length} regions</span>
          </div>
          <div className='mt-3 space-y-1'>
            {steps.map((s) => (
              <div key={s.name} className='grid grid-cols-[1.25rem_5rem_9rem_1fr] items-center'>
                <Mark kind={s.mark} />
                <span>{s.name}</span>
                <span className='text-ink-muted'>{s.state}</span>
                {s.progress ? (
                  <span className='flex items-center gap-3'>
                    <span className='relative block h-2.5 w-40 border border-ink'>
                      <span className='absolute inset-y-0 left-0 bg-ink-blue' style={{ width: `${s.progress * 100}%` }} />
                    </span>
                    <span>{s.detail}</span>
                  </span>
                ) : (
                  <span>{s.detail}</span>
                )}
              </div>
            ))}
            <div className='grid grid-cols-[1.25rem_5rem_1fr] items-center'>
              <span />
              <span>regions</span>
              <span className='flex flex-wrap gap-x-3'>
                {regions.map((r) => (
                  <span key={r.id}>
                    {r.code} <span className='text-ink-blue'>ready</span>
                  </span>
                ))}
              </span>
            </div>
          </div>
          <p className='mt-3 text-ink-muted'>
            waiting for source to drain · 2,318 transactions left · eta 7 s
          </p>
        </div>
      </div>
    </div>
  );
}

function Mark({ kind }: { kind: string }) {
  return kind === 'done' ? (
    <svg width='10' height='10' viewBox='0 0 10 10' aria-hidden='true'>
      <path d='M1 5.5L4 8.5L9 1.5' fill='none' stroke='var(--ink-blue)' strokeWidth='1.4' />
    </svg>
  ) : (
    <svg width='10' height='10' viewBox='0 0 10 10' aria-hidden='true'>
      <path d='M2 1L8 5L2 9Z' fill='var(--ink)' />
    </svg>
  );
}

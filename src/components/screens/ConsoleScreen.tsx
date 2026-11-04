import { quorumPeers, regions } from '~/content/topology';

// Sample cluster state for Pinecart's production cluster.
const rows: Record<string, { ranges: number; lag: string; p99: number; qps: string }> = {
  ore: { ranges: 412, lag: '0.31 s', p99: 6, qps: '3.1k' },
  vir: { ranges: 1288, lag: '0.29 s', p99: 5, qps: '9.8k' },
  sao: { ranges: 603, lag: '0.42 s', p99: 7, qps: '4.4k' },
  fra: { ranges: 1517, lag: '0.33 s', p99: 6, qps: '11.2k' },
  sin: { ranges: 1904, lag: '0.38 s', p99: 6, qps: '14.6k' },
  syd: { ranges: 377, lag: '0.35 s', p99: 5, qps: '2.7k' }
};

// Commits per second over 24 h, one sample an hour (thousands).
const commits = [9.1, 7.4, 6.2, 5.8, 6.4, 8.9, 13.2, 17.8, 19.4, 18.1, 17.2, 21.9, 26.4, 24.8, 19.9, 17.6, 18.8, 23.5, 28.1, 27.3, 22.4, 17.9, 13.6, 10.8];

/** Drawn screen: Pinecart's production cluster in the Strata console. */
export function ConsoleScreen() {
  const max = Math.max(...commits);
  const pts = commits.map((v, i) => `${(i / (commits.length - 1)) * 100} ${32 - (v / max) * 28}`).join(' L');
  return (
    <div
      className='overflow-hidden border border-ink bg-paper'
      role='img'
      aria-label='Strata console for the pinecart-prod cluster: six regions all healthy, replication lag between 0.29 and 0.42 seconds, read p99 between 5 and 7 milliseconds, and a 24-hour chart of commits per second peaking at 28 thousand.'
    >
      <div className='flex h-9 items-center justify-between border-b border-ink px-3'>
        <span className='annot-xs'>Strata console · pinecart-prod</span>
        <span className='annot-xs text-ink-muted'>Serializable · 6 regions · 3 to commit</span>
      </div>
      <div className='grid gap-0 sm:grid-cols-[1fr_14rem]'>
        <div className='overflow-x-auto'>
          <table className='w-full min-w-[30rem] text-left'>
            <thead>
              <tr className='annot-xs text-ink-muted'>
                <th className='border-b border-rule px-3 py-2 font-medium'>Region</th>
                <th className='border-b border-rule px-3 py-2 font-medium'>Quorum</th>
                <th className='border-b border-rule px-3 py-2 text-right font-medium'>Ranges led</th>
                <th className='border-b border-rule px-3 py-2 text-right font-medium'>Lag</th>
                <th className='border-b border-rule px-3 py-2 text-right font-medium'>Read p99</th>
                <th className='border-b border-rule px-3 py-2 text-right font-medium'>Txn/s</th>
              </tr>
            </thead>
            <tbody className='mono tnum text-[0.75rem]'>
              {regions.map((r) => {
                const row = rows[r.id];
                return (
                  <tr key={r.id} className='border-b border-rule last:border-0'>
                    <td className='px-3 py-1.5'>
                      <span className='mr-2 inline-block size-2 rounded-full bg-ink-blue align-middle' />
                      {r.code} <span className='text-ink-muted'>{r.name}</span>
                    </td>
                    <td className='px-3 py-1.5 text-ink-muted'>
                      {quorumPeers(r.id)
                        .map((p) => p.toUpperCase())
                        .join(' + ')}
                    </td>
                    <td className='px-3 py-1.5 text-right'>{row.ranges.toLocaleString('en-US')}</td>
                    <td className='px-3 py-1.5 text-right'>{row.lag}</td>
                    <td className='px-3 py-1.5 text-right'>{row.p99} ms</td>
                    <td className='px-3 py-1.5 text-right'>{row.qps}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className='border-t border-ink p-3 sm:border-t-0 sm:border-l'>
          <p className='annot-xs text-ink-muted'>Commits / s · 24 h</p>
          <p className='mono tnum mt-1 text-[1.25rem]'>
            28.1k <span className='annot-xs text-ink-muted'>peak 18:00 UTC</span>
          </p>
          <svg viewBox='0 0 100 34' preserveAspectRatio='none' className='mt-2 h-16 w-full' aria-hidden='true'>
            <path d={`M0 34L${pts}L100 34Z`} fill='url(#hatch-blue)' opacity='0.6' />
            <path d={`M${pts}`} fill='none' stroke='var(--ink-blue)' strokeWidth='1.25' vectorEffect='non-scaling-stroke' />
          </svg>
          <div className='mt-3 border-t border-rule pt-2'>
            <p className='annot-xs text-ink-muted'>Last drill</p>
            <p className='mono text-[0.75rem] leading-snug'>
              FRA down · Tue 12:41
              <br />
              failover 1.7 s · 0 writes lost
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

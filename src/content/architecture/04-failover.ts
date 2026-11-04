import type { ArchitectureSection } from './types';

export const section: ArchitectureSection = {
  slug: 'failover',
  order: 4,
  sheet: 'B-04',
  title: 'Failover',
  revision: 'E',
  updated: '2026-10-30',
  summary:
    'When a region goes dark its leases expire, four regions elect new leaders, and clients reconnect. The median is 1.8 seconds.',
  diagram: 'failover-timeline',
  figure: 'Failover after losing Frankfurt, dimensioned in milliseconds.',
  body: [
    {
      type: 'p',
      text: 'Leaders hold leases on their ranges. A lease is granted and renewed by four regions and lasts 900 ms. A region that stops answering heartbeats stops renewing, so within 900 ms every lease it held has expired, and nobody else can be granted one before that.'
    },
    {
      type: 'p',
      text: 'The surviving replicas then elect a new leader for each range. An election needs votes from four regions, and any four regions include at least one of the three that hold each committed write, because 3 + 4 is more than 6. The new leader copies the tail of the log from that region before it accepts writes. That is why no committed write is lost.'
    },
    {
      type: 'p',
      text: 'Clients see a closed connection, or error `40001` on a transaction in flight. The client library reconnects to the next nearest region and retries. A transaction that never got a commit reply is retried; one that did is already safe in three regions.'
    },
    {
      type: 'spec',
      rows: [
        ['Lease expiry', '900 ms'],
        ['Election', '≈ 300 ms, four votes'],
        ['Log tail catch-up', '≈ 200 ms'],
        ['Client reconnect and retry', '≈ 400 ms'],
        ['Total, median', '1.8 s'],
        ['Total, p99', '3.5 s']
      ]
    },
    { type: 'h', text: 'Three regions down' },
    {
      type: 'p',
      text: 'With three of six regions down, three remain. That is enough to hold a committed write, but not enough to grant a lease. Strata pauses writes rather than accept one it might not keep. Reads continue from local copies, and every response reports how stale it is. Bring one region back and writes resume.'
    }
  ]
};

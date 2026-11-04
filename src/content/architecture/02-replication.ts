import type { ArchitectureSection } from './types';

export const section: ArchitectureSection = {
  slug: 'replication',
  order: 2,
  sheet: 'B-02',
  title: 'Replication',
  revision: 'D',
  updated: '2026-10-21',
  summary:
    'Tables split into ranges. Each range has one consensus log with a copy in every region, and a write commits once three regions have it on disk.',
  diagram: 'quorum-write',
  figure: 'A write led from Frankfurt, committed with Virginia and Oregon.',
  body: [
    {
      type: 'p',
      text: 'Strata splits each table into ranges of about 256 MB by primary key. Every range has a replica in each of the six regions and one leader, placed in the region where most of its writes come from. For a table created `WITH (strata.home = \'nearest\')`, that is the region nearest each row’s writer.'
    },
    {
      type: 'p',
      text: 'A write goes to the range leader. The leader appends it to its log and sends it to the other five replicas at once. When two of them have written the entry to disk and answered, three regions hold it: the leader commits and replies. The remaining replicas catch up in the background.'
    },
    { type: 'h', text: 'Why three' },
    {
      type: 'p',
      text: 'Three copies in three regions means any two regions can be lost without losing a committed write. The leader never waits for the slowest regions. It commits on the first two acknowledgements, which in practice come from its two nearest neighbours.'
    },
    {
      type: 'spec',
      rows: [
        ['Commit quorum', '3 of 6 regions, leader included'],
        ['Commit wait', '90 ms from Virginia, 160 ms from Singapore'],
        ['Range size', '≈ 256 MB, split and merged automatically'],
        ['Log entries', 'Checksummed, flushed to disk before acknowledgement']
      ]
    }
  ]
};

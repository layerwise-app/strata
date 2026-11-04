import type { ArchitectureSection } from './types';

export const section: ArchitectureSection = {
  slug: 'partition',
  order: 5,
  sheet: 'B-05',
  title: 'Network partitions',
  revision: 'B',
  updated: '2026-10-07',
  summary:
    'If the network splits the cluster, only a side with four or more regions keeps writing. No side accepts a write the other could contradict.',
  diagram: 'partition',
  figure: 'A 4 | 2 split: the Americas and Frankfurt against Singapore and Sydney.',
  body: [
    {
      type: 'p',
      text: 'A partition is not a failure. Both sides are running, and each believes the other is down. Strata handles it exactly as it handles a failure, with one rule that settles every case: a write lease needs four regions.'
    },
    {
      type: 'p',
      text: 'Split six regions four against two, and the side with four keeps its leases or wins them within 1.8 seconds. The side with two cannot renew; within 900 ms it stops accepting writes and keeps serving reads, each marked with how old it is.'
    },
    {
      type: 'p',
      text: 'Split three against three, and neither side has four. Writes pause everywhere until the network heals. It is the one case where a partition stops writes, and it is deliberate: the alternative is two sides accepting writes that cannot both be kept.'
    },
    {
      type: 'list',
      items: [
        '4 | 2: the four keep writing; the two serve reads marked stale.',
        '5 | 1: the isolated region stops writing within 900 ms.',
        '3 | 3: writes pause on both sides; reads continue.',
        'Healing: the cut-off side catches up from the log. There is nothing to merge.'
      ]
    },
    {
      type: 'note',
      label: 'From a drill',
      text: 'Pinecart cut Oregon, Virginia and São Paulo off from the other three for ten minutes on a staging cluster. Writes paused, reads kept serving with up to ten minutes of staleness, and writes resumed 1.1 s after the network healed, with no conflicts to resolve.'
    }
  ]
};

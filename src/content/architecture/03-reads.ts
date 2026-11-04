import type { ArchitectureSection } from './types';

export const section: ArchitectureSection = {
  slug: 'reads',
  order: 3,
  sheet: 'B-03',
  title: 'Reads from the nearest copy',
  revision: 'B',
  updated: '2026-09-30',
  summary:
    'Followers know exactly how far behind they are. The nearest copy answers a read only when it can answer it correctly.',
  diagram: 'local-reads',
  figure: 'A follower in Singapore serves a read at t − 2 s once its closed timestamp has passed it.',
  body: [
    {
      type: 'p',
      text: 'Every replica tracks a closed timestamp: a moment before which it has received every write its leader will ever commit. Leaders advance it every 200 ms and ship it with the log, so a healthy follower trails real time by about one round trip to its leader.'
    },
    {
      type: 'p',
      text: 'When a query allows staleness, as with `SET strata.read_staleness = \'2s\'`, the planner picks a timestamp two seconds back and sends the read to the nearest replica whose closed timestamp has passed it. The answer is a consistent snapshot: every row is from the same moment, and nothing committed before that moment is missing.'
    },
    {
      type: 'p',
      text: 'Reads inside a read-write transaction, and reads that allow no staleness, go to the range leader. For rows homed near their writer, the leader is usually the nearest region anyway.'
    },
    {
      type: 'note',
      label: 'Why not any replica?',
      text: 'A replica that answers without checking its closed timestamp can return a row from before your own last write. Strata never does: if the nearest copy is too far behind, the read moves to the next one.'
    }
  ]
};

import type { ArchitectureSection } from './types';

export const section: ArchitectureSection = {
  slug: 'consistency',
  order: 1,
  sheet: 'B-01',
  title: 'Consistency model',
  revision: 'C',
  updated: '2026-10-14',
  summary:
    'Every transaction is serializable. Hybrid logical clocks order commits across regions, and no read is contradicted by a later one.',
  diagram: 'serializable-timeline',
  figure: 'Two transactions in two regions, ordered by commit timestamp.',
  body: [
    {
      type: 'p',
      text: 'Strata runs every transaction at the `SERIALIZABLE` isolation level. There is no weaker level to opt into by accident: if two transactions could produce a result that no serial order would, one of them is aborted and retried.'
    },
    {
      type: 'p',
      text: 'Each transaction takes a timestamp from a hybrid logical clock: physical time from the node, plus a logical counter that moves forward whenever the node sees a later timestamp in a message. Clocks across regions are kept within 250 ms of each other. A node that drifts further stops serving and leaves the cluster on its own.'
    },
    { type: 'h', text: 'Reading at a timestamp' },
    {
      type: 'p',
      text: 'A read at timestamp t sees every write committed before t and nothing after it. When a read meets an uncommitted write inside its clock-uncertainty window, it waits for that write to resolve or restarts at a later timestamp. No client ever reads a value and then sees an older one.'
    },
    { type: 'h', text: 'In SQL' },
    {
      type: 'list',
      items: [
        '`BEGIN; … COMMIT;` is serializable. `READ COMMITTED` and `REPEATABLE READ` are accepted for compatibility and run as `SERIALIZABLE`.',
        'Retry errors use SQLSTATE `40001`, the code Postgres uses for serialization failures, so existing retry logic works unchanged.',
        'The TypeScript and Go clients retry `40001` for you with jittered backoff, up to five attempts.'
      ]
    },
    {
      type: 'note',
      label: 'Trade-off',
      text: 'Serializable means more aborts when many transactions fight over the same rows. In Pinecart’s checkout, 0.03% of transactions retried once and none retried twice.'
    }
  ]
};

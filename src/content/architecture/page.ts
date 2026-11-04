/** Copy for the Architecture page around its sections. */
export const architecturePage = {
  sheet: {
    number: 'B-00',
    name: 'Architecture',
    scale: 'NTS'
  },
  eyebrow: 'Architecture',
  headline: 'How Strata keeps every write, and what it does when regions can’t talk.',
  intro:
    'This is the long version: the consistency model, how a write is replicated, where reads come from, what failover does second by second, and how a network partition plays out. Every number on this page is a default you can see in the console.',
  contents: 'Contents',
  backToTop: 'Back to contents',
  meta: {
    title: 'Architecture — Strata consistency, replication and failover',
    description:
      'How Strata commits writes in three regions, serves reads from the nearest copy, fails over in 1.8 s and behaves in a network partition.'
  },
  cta: {
    headline: 'Want to run the drill on your own workload?',
    body: 'Design partners get a production cluster in the regions they need, and an afternoon with us breaking it on purpose.'
  }
};

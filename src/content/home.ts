/**
 * Copy and data for every section of the landing page, in page order.
 * Change a headline, a number or a quote here; components only lay it out.
 */
import type { RegionId } from './topology';
import type { ScreenSource } from './screens';

export type SheetMeta = {
  /** Drawing number in the title block, like A-01. */
  number: string;
  /** Sheet name in the title block. */
  name: string;
  revision: string;
  scale: string;
  /** ISO date, shown as written. */
  date: string;
};

export type Callout = { line: number; text: string };

// ── A-01 Hero ──────────────────────────────────────────────────────────────

export const hero = {
  id: 'system',
  sheet: {
    number: 'A-01',
    name: 'System overview',
    revision: 'D',
    scale: 'NTS',
    date: '2026-10-30'
  } satisfies SheetMeta,
  eyebrow: 'Distributed SQL · Postgres-compatible',
  headline: 'Reads from next door. Writes that outlive a region.',
  subhead:
    'Strata keeps a copy of your data in six regions. Every user reads from the nearest one, and every write is logged in three regions before Strata says yes. Lose a region, and no write goes with it.',
  figure: 'Fig. 1 — Live system',
  instruction: 'Click a region, or focus it and press Enter, to take it down.',
  instructionTouch: 'Tap a region to take it down. Tap again to bring it back.',
  legend: {
    request: 'Request',
    replicate: 'Replicate',
    ack: 'Acknowledge',
    commit: 'Commit'
  },
  readout: {
    status: 'Status',
    commits: 'Commits',
    lost: 'Writes lost',
    failover: 'Failover',
    healthy: 'All six regions up. Writes commit in three.',
    failingOver: '{region} down. Moving its leases…',
    failedOver: '{region} down. 0 writes lost, failover {seconds} s.',
    twoDown: '{regions} down. 0 writes lost, quorum re-formed.',
    paused:
      'Writes paused by design: a write lease needs 4 regions to agree, and only 3 are up.',
    readsContinue: 'Reads continue from the nearest live copy.',
    restored: '{region} back. Its log caught up from the quorum.',
    resumed: 'Writes resumed. Queued writes committed, none lost.',
    limit: 'Three regions are down. Bring one back first.',
    reset: 'Bring all regions back'
  }
};

// ── A-02 Latency ───────────────────────────────────────────────────────────

export const latency = {
  id: 'latency',
  sheet: {
    number: 'A-02',
    name: 'Latency by city',
    revision: 'C',
    scale: '1:1',
    date: '2026-10-21'
  } satisfies SheetMeta,
  eyebrow: 'Latency explorer',
  headline: 'Pick a city. See what its users wait for.',
  intro:
    'Twelve cities where Pinecart has shoppers, against the same app on one Postgres region in Virginia. Reads get faster wherever Strata has a closer copy. Writes pay one hop between regions, so cities next to Virginia write a little slower. That hop is what keeps a write alive when a region is not.',
  cityLabel: 'City',
  servedBy: 'Served by',
  singleLabel: 'Single region',
  singleSub: 'Virginia',
  strataLabel: 'Strata',
  strataSub: 'nearest copy',
  differenceLabel: 'Difference',
  rows: {
    readP50: 'Read p50',
    readP99: 'Read p99',
    writeP50: 'Write p50',
    writeP99: 'Write p99'
  },
  faster: 'faster',
  slower: 'slower',
  same: 'same',
  figure: 'Fig. 2 — Route from {city}'
};

// ── A-03 Engine ────────────────────────────────────────────────────────────

export const engine = {
  id: 'engine',
  sheet: {
    number: 'A-03',
    name: 'Engine, exploded view',
    revision: 'B',
    scale: '1:4',
    date: '2026-09-18'
  } satisfies SheetMeta,
  eyebrow: 'Engine',
  headline: 'Four layers, each with one job.',
  intro:
    'Strata runs as one binary per node. A query travels down through four layers and the answer comes back up the same way.',
  figure: 'Fig. 3 — Engine, exploded',
  layers: [
    {
      name: 'SQL layer',
      spec: 'PG wire v3',
      text: 'Speaks the Postgres wire protocol and parses queries the way Postgres 16 does, so drivers, ORMs and psql work unchanged.'
    },
    {
      name: 'Planner',
      spec: 'Cost + RTT',
      text: 'Cost-based and aware of geography. It knows where every copy lives and how fresh it is, and sends each read to the nearest copy that can answer.'
    },
    {
      name: 'Replication log',
      spec: '3 of 6 to commit',
      text: 'One consensus log per range of rows. A write commits when three regions have it on disk. Leases need four, so a new leader always holds every committed write.'
    },
    {
      name: 'Storage',
      spec: 'LSM · NVMe',
      text: 'A log-structured merge tree on local NVMe in every region, with checksummed pages and continuous backup for 30 days of point-in-time recovery.'
    }
  ],
  readMore: 'How the log, leases and failover fit together',
  readMoreHref: '/architecture'
};

// ── A-04 Developer experience ──────────────────────────────────────────────

export const developers = {
  id: 'developers',
  sheet: {
    number: 'A-04',
    name: 'Developer experience',
    revision: 'C',
    scale: '1:1',
    date: '2026-10-09'
  } satisfies SheetMeta,
  eyebrow: 'Developer experience',
  headline: 'From where your app sits, it is Postgres.',
  intro:
    'Strata speaks the Postgres wire protocol and the SQL your app already sends. Keep your driver, your ORM and your migrations. There are two new ideas, both optional: where a row lives, and how stale a read may be.',
  sql: {
    title: 'schema.sql',
    caption: 'Fig. 4 — Postgres-compatible SQL',
    lines: [
      'CREATE TABLE carts (',
      '  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),',
      '  shopper_id  uuid NOT NULL,',
      "  items       jsonb NOT NULL DEFAULT '[]',",
      '  updated_at  timestamptz NOT NULL DEFAULT now()',
      ") WITH (strata.home = 'nearest');",
      '',
      "SET strata.read_staleness = '2s';",
      'SELECT items FROM carts WHERE shopper_id = $1;',
      '',
      'BEGIN;',
      'UPDATE carts SET items = items || $2, updated_at = now()',
      ' WHERE shopper_id = $1;',
      'COMMIT;'
    ],
    callouts: [
      { line: 6, text: 'Rows live in the region nearest the shopper who writes them.' },
      { line: 8, text: 'Reads may come from the local copy, at most 2 s old.' },
      { line: 11, text: 'Serializable is the default and the only level.' },
      { line: 14, text: 'Returns once three regions have logged the write.' }
    ] satisfies Callout[]
  },
  client: {
    title: 'cart.ts',
    caption: 'Fig. 5 — TypeScript client',
    lines: [
      "import { createPool } from '@ironleaf/strata';",
      '',
      'const db = createPool({',
      '  url: process.env.STRATA_URL,',
      "  readStaleness: '2s',",
      '});',
      '',
      'export async function addToCart(shopperId: string, item: Item) {',
      '  return db.transaction(async (tx) => {',
      '    const cart = await tx.one(',
      "      'SELECT items FROM carts WHERE shopper_id = $1 FOR UPDATE',",
      '      [shopperId],',
      '    );',
      "    await tx.query('UPDATE carts SET items = $2 WHERE shopper_id = $1',",
      '      [shopperId, [...cart.items, item]]);',
      '  });',
      '}'
    ],
    callouts: [
      { line: 4, text: 'One URL. The client connects to the nearest live region.' },
      { line: 5, text: 'Applies to every read on this pool unless a query overrides it.' },
      { line: 9, text: 'Conflicts are retried with backoff, up to five times.' },
      { line: 16, text: 'Resolves after the commit quorum answers, never before.' }
    ] satisfies Callout[]
  },
  migration: {
    headline: 'From one Postgres to six regions, in four steps',
    figure: 'Fig. 6 — Migration path',
    steps: [
      {
        name: 'Mirror',
        duration: 'Hours',
        text: 'Point Strata at your Postgres. It copies a snapshot, then follows the write-ahead log through logical replication. Your app does not change.'
      },
      {
        name: 'Shadow reads',
        duration: 'Days',
        text: 'Send a share of reads to Strata and compare every result with Postgres. Mismatches show up by query, with both rows side by side.'
      },
      {
        name: 'Cut over',
        duration: '≈ 20 s write pause',
        text: 'Strata waits for the log to drain, takes the primary role and hands your app a new URL. Writes pause for seconds, not minutes.'
      },
      {
        name: 'Add regions',
        duration: 'Hours per region',
        text: 'Add regions one at a time. Each copies data in the background and starts serving local reads once it has caught up.'
      }
    ]
  },
  screen: {
    name: 'migrateCli',
    caption: 'Fig. 7 — Cutover from the command line'
  }
};

// ── A-05 Case ──────────────────────────────────────────────────────────────

export const caseStudy = {
  id: 'case',
  sheet: {
    number: 'A-05',
    name: 'Case: Pinecart',
    revision: 'A',
    scale: '1:1',
    date: '2026-08-27'
  } satisfies SheetMeta,
  eyebrow: 'Case study',
  customer: 'Pinecart',
  customerNote: 'Grocery delivery · users in 30 countries',
  headline: 'Pinecart moved checkout off a single region in six weeks.',
  body: [
    'Pinecart delivers groceries in 30 countries from one Postgres primary in Virginia. Shoppers in Jakarta waited more than a second for a cart to load, and an outage in Virginia in 2025 stopped checkout for 3 hours 40 minutes.',
    'They mirrored to Strata in March, moved reads in April and cut over writes on a Sunday morning in May. Their first region-loss drill ran at lunchtime on a Tuesday.'
  ],
  stats: [
    { label: 'Cart load p99, Jakarta', before: '1,180 ms', after: '38 ms' },
    { label: 'Checkout down when a region fails', before: '3 h 40 min', after: '1.8 s' },
    { label: 'Database pages to on-call, per quarter', before: '14', after: '2' }
  ],
  beforeLabel: 'Before',
  afterLabel: 'After',
  quote:
    'We took Frankfurt down in the middle of the Tuesday lunch rush. Carts kept loading. The only people who noticed were the ones watching the infra channel.',
  quoteBy: 'Mireille Okonkwo',
  quoteRole: 'Head of Infrastructure, Pinecart',
  screen: {
    name: 'console',
    caption: 'Fig. 8 — Pinecart’s cluster in the Strata console'
  }
};

// ── A-06 Guarantees ────────────────────────────────────────────────────────

export const guarantees = {
  id: 'guarantees',
  sheet: {
    number: 'A-06',
    name: 'Specification',
    revision: 'E',
    scale: '—',
    date: '2026-10-30'
  } satisfies SheetMeta,
  eyebrow: 'Guarantees',
  headline: 'What we promise, in writing.',
  columns: { item: 'Item', spec: 'Specification', notes: 'Notes', ref: 'Ref.' },
  rows: [
    {
      item: 'Isolation',
      spec: 'Serializable transactions',
      notes: 'The default and the only level. Conflicting transactions are retried by the client library.',
      ref: { label: 'B-01', href: '/architecture#consistency' }
    },
    {
      item: 'Durability',
      spec: 'Commit after 3 regions log the write',
      notes: 'No acknowledged write is lost with up to two regions down.',
      ref: { label: 'B-02', href: '/architecture#replication' }
    },
    {
      item: 'Availability',
      spec: '99.995% target, per month',
      notes: 'About 2 minutes 10 seconds a month. Service credits when we miss it.',
      ref: { label: 'B-04', href: '/architecture#failover' }
    },
    {
      item: 'Region loss',
      spec: 'Survives 2 of 6 regions down',
      notes: 'Failover in 1.8 s at the median. At three down, writes pause by design and reads continue.',
      ref: { label: 'B-04', href: '/architecture#failover' }
    },
    {
      item: 'Encryption',
      spec: 'At rest and in transit',
      notes: 'AES-256-GCM with per-region keys. TLS 1.3 between clients, nodes and regions.',
      ref: null
    },
    {
      item: 'Recovery',
      spec: 'Point-in-time recovery, 30 days',
      notes: 'Restore to any second into a new cluster while the live one keeps serving.',
      ref: null
    },
    {
      item: 'Compatibility',
      spec: 'Postgres 16 wire protocol and SQL',
      notes: 'pgcrypto, uuid-ossp and pg_trgm included. Custom C extensions are not supported.',
      ref: null
    }
  ]
};

// ── A-07 Design partners ───────────────────────────────────────────────────

export const designPartners = {
  id: 'design-partners',
  sheet: {
    number: 'A-07',
    name: 'Design partners',
    revision: 'A',
    scale: '1:1',
    date: '2026-11-02'
  } satisfies SheetMeta,
  eyebrow: 'Design partners',
  headline: 'Build the 1.0 with us.',
  intro:
    'We are taking twelve design partners for 2027: teams with users on more than one continent and a Postgres they have outgrown.',
  offers: [
    'A production cluster in the regions you need, free through 2027.',
    'A shared channel with the engineers who wrote the replication log.',
    'A seat at the monthly roadmap review, with a vote on what ships next.'
  ],
  form: {
    title: 'Application',
    email: 'Work email',
    emailHint: 'We reply from a person, not a sequence.',
    company: 'Company',
    regions: 'Where are your users?',
    regionsHint: 'Pick every region you need.',
    dataSize: 'How much data?',
    submit: 'Become a design partner',
    submitting: 'Sending…',
    success: {
      title: 'You are on the list.',
      body: 'We read every application and reply within two working days.'
    },
    duplicate: {
      title: 'Already on the list.',
      body: '{email} has applied before, so there is nothing more to do. We will be in touch.'
    },
    rateLimited:
      'That is a lot of applications from one network. Please try again in an hour.',
    failed:
      'We could not send that. Your answers are still here: check your connection and press the button again.',
    fixErrors: 'Check the marked fields.',
    errors: {
      email: 'Enter a work email, like ada@company.com.',
      company: 'Enter your company name.',
      regions: 'Pick at least one region.',
      dataSize: 'Pick a data size.'
    }
  }
};

/** Labels for the regions field, in map order. */
export const regionOptions: { id: RegionId; label: string }[] = [
  { id: 'ore', label: 'Oregon' },
  { id: 'vir', label: 'Virginia' },
  { id: 'sao', label: 'São Paulo' },
  { id: 'fra', label: 'Frankfurt' },
  { id: 'sin', label: 'Singapore' },
  { id: 'syd', label: 'Sydney' }
];

/**
 * Product screens. Each one is drawn in code until you set a real image or
 * video here; see README → Replace a drawn screen.
 */
export const screens: Record<'console' | 'migrateCli', ScreenSource> = {
  console: { kind: 'drawn' },
  migrateCli: { kind: 'drawn' }
};

/** What search engines and link previews read for the home page. */
export const homeMeta = {
  title: 'Strata — distributed SQL that survives a lost region',
  description:
    'Postgres-compatible SQL with a copy of your data near every user. Writes commit in three regions, reads come from the nearest. By Ironleaf Systems, Zurich.',
  shareTitle: 'Reads from next door. Writes that outlive a region.'
};

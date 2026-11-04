/**
 * Shape of one Architecture section. Each section lives in its own file in
 * this folder, named `NN-slug.ts` and exporting it as `section`.
 */

/** Drawn diagrams a section can show; see src/components/architecture/diagrams. */
export type DiagramKey =
  | 'serializable-timeline'
  | 'quorum-write'
  | 'local-reads'
  | 'failover-timeline'
  | 'partition';

/** A paragraph of body text. Wrap code in `backticks`. */
export type Block =
  | { type: 'p'; text: string }
  | { type: 'h'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'note'; label: string; text: string }
  | { type: 'spec'; rows: [label: string, value: string][] };

export type ArchitectureSection = {
  /** Anchor on the page: /architecture#slug */
  slug: string;
  /** Position on the page, lowest first. */
  order: number;
  /** Drawing number in the title block, like B-03. */
  sheet: string;
  title: string;
  revision: string;
  /** ISO date of the last change; the sitemap uses the newest one. */
  updated: string;
  /** One or two sentences, shown in the contents list. */
  summary: string;
  diagram?: DiagramKey;
  /** Caption under the diagram. */
  figure?: string;
  body: Block[];
};

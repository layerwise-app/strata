import type { ArchitectureSection } from './types';

export type { ArchitectureSection, Block, DiagramKey } from './types';
export { architecturePage } from './page';

// Every `NN-slug.ts` file in this folder is a section. Add a file to add one.
const modules = import.meta.glob<{ section: ArchitectureSection }>('./[0-9]*.ts', {
  eager: true
});

export const architectureSections: ArchitectureSection[] = Object.values(modules)
  .map((m) => m.section)
  .sort((a, b) => a.order - b.order);

/** Newest `updated` date across sections, for the sitemap and title block. */
export const architectureUpdated = architectureSections
  .map((s) => s.updated)
  .sort()
  .at(-1) ?? '2026-01-01';

/** Highest revision letter across sections. */
export const architectureRevision = architectureSections
  .map((s) => s.revision)
  .sort()
  .at(-1) ?? 'A';

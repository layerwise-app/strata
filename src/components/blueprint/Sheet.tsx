import type { ReactNode } from 'react';
import { cn } from '~/lib/utils';
import type { SheetMeta } from '~/content/home';
import { TitleBlock } from './TitleBlock';

const zones = ['1', '2', '3', '4', '5', '6', '7', '8'];

/**
 * A numbered drawing sheet: a 1 px frame with zone marks along the top edge
 * and a title block in the top-right corner.
 */
export function Sheet({
  id,
  meta,
  eyebrow,
  children,
  className,
  labelledBy
}: {
  id: string;
  meta: SheetMeta;
  eyebrow?: string;
  children: ReactNode;
  className?: string;
  /** id of the sheet's heading, for the section landmark. */
  labelledBy?: string;
}) {
  return (
    <section
      id={id}
      aria-labelledby={labelledBy}
      className={cn('mx-auto w-full max-w-[1360px] px-3 sm:px-6 lg:px-8', className)}
    >
      <div className='sheet'>
        <ZoneMarks />
        <div className='flex min-h-12 items-stretch justify-between border-b border-ink'>
          <div className='flex min-w-0 items-center gap-3 px-4 py-3 sm:px-6'>
            <span className='annot whitespace-nowrap text-ink-blue'>{meta.number}</span>
            {eyebrow ? (
              <>
                <span aria-hidden='true' className='h-px w-6 flex-none bg-ink' />
                <span className='annot text-ink'>{eyebrow}</span>
              </>
            ) : null}
          </div>
          <TitleBlock meta={meta} row className='hidden border-l border-ink lg:grid' />
        </div>
        {children}
        {/* On smaller screens the title block sits at the foot of the sheet. */}
        <TitleBlock meta={meta} className='border-t border-ink lg:hidden' />
      </div>
    </section>
  );
}

/** Zone numbers along the top edge, like a printed drawing. Decorative. */
function ZoneMarks() {
  return (
    <div
      aria-hidden='true'
      className='pointer-events-none absolute -top-4 right-0 left-0 hidden grid-cols-8 md:grid'
    >
      {zones.map((z) => (
        <span key={z} className='annot-xs relative text-center text-ink-muted'>
          <span className='absolute top-3 left-0 h-1 w-px bg-ink' />
          {z}
        </span>
      ))}
    </div>
  );
}

/** Inner padding used by sheet content. */
export const sheetPad = 'px-4 sm:px-6 lg:px-10';

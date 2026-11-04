import { cn } from '~/lib/utils';
import type { SheetMeta } from '~/content/home';

/**
 * The small table in a sheet's corner: number, name, revision, scale, date.
 * `row` lays the five cells in one line for wide screens.
 */
export function TitleBlock({
  meta,
  className,
  row = false
}: {
  meta: SheetMeta;
  className?: string;
  row?: boolean;
}) {
  if (row) {
    return (
      <dl
        className={cn('grid grid-cols-[auto_minmax(9rem,auto)_auto_auto_auto] bg-paper text-ink', className)}
        aria-label={`Title block, sheet ${meta.number}`}
      >
        <Cell label='Sheet' value={meta.number} className='border-r border-ink' strong />
        <Cell label='Title' value={meta.name} className='border-r border-ink' />
        <Cell label='Rev' value={meta.revision} className='border-r border-ink' />
        <Cell label='Scale' value={meta.scale} className='border-r border-ink' />
        <Cell label='Date' value={meta.date} />
      </dl>
    );
  }
  return (
    <dl
      className={cn('grid grid-cols-[1fr_1fr_1.6fr] bg-paper text-ink', className)}
      aria-label={`Title block, sheet ${meta.number}`}
    >
      <Cell label='Sheet' value={meta.number} className='border-r border-b border-ink' strong />
      <Cell label='Title' value={meta.name} className='col-span-2 border-b border-ink' />
      <Cell label='Rev' value={meta.revision} className='border-r border-ink' />
      <Cell label='Scale' value={meta.scale} className='border-r border-ink' />
      <Cell label='Date' value={meta.date} />
    </dl>
  );
}

function Cell({
  label,
  value,
  className,
  strong
}: {
  label: string;
  value: string;
  className?: string;
  strong?: boolean;
}) {
  return (
    <div className={cn('min-w-0 px-3 py-1.5', className)}>
      <dt className='annot-xs text-ink-muted'>{label}</dt>
      <dd
        className={cn(
          'mono truncate text-[0.75rem] leading-5 tracking-[0.04em] whitespace-nowrap uppercase',
          strong && 'font-medium text-ink-blue'
        )}
      >
        {value}
      </dd>
    </div>
  );
}

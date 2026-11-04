import { Sheet, sheetPad } from '~/components/blueprint/Sheet';
import { SiteLink } from '~/components/site/SiteLink';
import { guarantees } from '~/content/home';

export function Guarantees() {
  const c = guarantees.columns;
  return (
    <Sheet id={guarantees.id} meta={guarantees.sheet} eyebrow={guarantees.eyebrow} labelledBy='guarantees-title'>
      <div className={`pt-10 pb-8 ${sheetPad}`}>
        <h2 id='guarantees-title' className='heading text-[2rem] sm:text-[2.75rem]'>
          {guarantees.headline}
        </h2>
      </div>
      <div className={`pb-10 ${sheetPad}`}>
        <table className='w-full border-collapse border border-ink text-left'>
          <caption className='sr-only'>Strata specification</caption>
          <thead className='hidden md:table-header-group'>
            <tr className='annot-xs text-ink-muted'>
              <th scope='col' className='w-12 border-b border-ink px-3 py-2 font-medium'>No.</th>
              <th scope='col' className='border-b border-l border-ink px-3 py-2 font-medium'>{c.item}</th>
              <th scope='col' className='border-b border-l border-ink px-3 py-2 font-medium'>{c.spec}</th>
              <th scope='col' className='border-b border-l border-ink px-3 py-2 font-medium'>{c.notes}</th>
              <th scope='col' className='w-20 border-b border-l border-ink px-3 py-2 font-medium'>{c.ref}</th>
            </tr>
          </thead>
          <tbody>
            {guarantees.rows.map((row, i) => (
              <tr key={row.item} className='border-b border-ink last:border-b-0 max-md:grid max-md:grid-cols-[2.5rem_1fr_auto] max-md:py-3'>
                <td className='mono tnum px-3 align-top text-ink-muted md:py-4'>{String(i + 1).padStart(2, '0')}</td>
                <th scope='row' className='annot px-3 pt-0.5 text-left align-top font-medium md:border-l md:border-ink md:py-4 max-md:col-start-2'>
                  {row.item}
                </th>
                <td className='px-3 align-top text-[1.0625rem] leading-snug font-[500] md:border-l md:border-ink md:py-4 max-md:col-span-2 max-md:col-start-2 max-md:mt-1'>
                  {row.spec}
                </td>
                <td className='body-copy px-3 align-top text-[0.9375rem] md:border-l md:border-ink md:py-4 max-md:col-span-2 max-md:col-start-2 max-md:mt-1'>
                  {row.notes}
                </td>
                <td className='annot px-3 align-top md:border-l md:border-ink md:py-4 max-md:col-start-3 max-md:row-start-1'>
                  {row.ref ? (
                    <SiteLink href={row.ref.href} className='link inline-flex min-h-11 min-w-11 items-center text-ink-blue md:min-h-6 md:min-w-0'>
                      <span className='sr-only'>See sheet </span>
                      {row.ref.label}
                    </SiteLink>
                  ) : (
                    <span className='text-ink-muted' aria-label='No reference'>—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Sheet>
  );
}

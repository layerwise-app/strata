import { Link } from '@tanstack/react-router';
import { TitleBlock } from '~/components/blueprint/TitleBlock';
import { notFound } from '~/content/legal';

/** The 404 page: a blank drawing sheet with a rubber stamp. */
export function NotFound() {
  const meta = { ...notFound.sheet, scale: '—' };
  return (
    <section
      aria-labelledby='not-found-title'
      className='mx-auto w-full max-w-[1360px] px-3 pt-10 sm:px-6 lg:px-8'
    >
      <div className='sheet relative flex min-h-[34rem] flex-col sm:min-h-[40rem]'>
        <div className='flex justify-end border-b border-ink'>
          <TitleBlock meta={meta} row className='hidden border-l border-ink lg:grid' />
          <TitleBlock meta={meta} className='w-full lg:hidden' />
        </div>

        <div className='relative flex flex-1 flex-col items-center justify-center px-6 py-16 text-center'>
          {/* Registration crosshairs at the sheet centre lines. */}
          <svg
            aria-hidden='true'
            className='pointer-events-none absolute inset-0 h-full w-full text-ink-muted'
          >
            <line x1='50%' x2='50%' y1='0' y2='18' stroke='currentColor' />
            <line x1='50%' x2='50%' y1='100%' y2='calc(100% - 18px)' stroke='currentColor' />
            <line x1='0' x2='18' y1='50%' y2='50%' stroke='currentColor' />
            <line x1='100%' x2='calc(100% - 18px)' y1='50%' y2='50%' stroke='currentColor' />
          </svg>

          <div
            className='stamp mb-10 inline-block -rotate-[7deg] border-[3px] border-double border-ink-blue px-6 py-3 text-ink-blue sm:px-9 sm:py-4'
            role='img'
            aria-label={notFound.stamp}
          >
            <span className='mono block text-[1.6rem] leading-none font-medium tracking-[0.14em] uppercase sm:text-[2.4rem]'>
              {notFound.stamp}
            </span>
            <span className='annot-xs mt-2 block tracking-[0.3em]'>
              Ref. X-404 · Not issued
            </span>
          </div>

          <h1 id='not-found-title' className='heading text-[1.75rem] sm:text-[2.25rem]'>
            {notFound.title}
          </h1>
          <p className='body-copy mt-3 max-w-md'>{notFound.body}</p>
          <div className='mt-8 flex flex-wrap justify-center gap-3'>
            <Link to='/' className='btn btn-primary'>
              {notFound.home}
            </Link>
            <Link to='/architecture' className='btn btn-secondary'>
              {notFound.architecture}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

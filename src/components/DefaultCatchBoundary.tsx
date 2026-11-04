import { Link, useRouter, type ErrorComponentProps } from '@tanstack/react-router';
import { useEffect } from 'react';
import { TitleBlock } from '~/components/blueprint/TitleBlock';
import type { SheetMeta } from '~/content/home';

const meta: SheetMeta = {
  number: 'X-500',
  name: 'Render error',
  revision: '—',
  scale: '—',
  date: '—'
};

/** Shown when a page throws: the same blank sheet as the 404, stamped VOID. */
export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter();

  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <section
      aria-labelledby='error-title'
      className='mx-auto w-full max-w-[1360px] px-3 pt-10 sm:px-6 lg:px-8'
    >
      <div className='sheet relative flex min-h-[30rem] flex-col'>
        <div className='flex justify-end border-b border-ink'>
          <TitleBlock meta={meta} row className='hidden border-l border-ink lg:grid' />
          <TitleBlock meta={meta} className='w-full lg:hidden' />
        </div>
        <div className='flex flex-1 flex-col items-center justify-center px-6 py-16 text-center'>
          <div
            className='stamp mb-10 inline-block -rotate-[5deg] border-[3px] border-double border-ink-blue px-6 py-3 text-ink-blue'
            role='img'
            aria-label='Void'
          >
            <span className='mono block text-[1.6rem] leading-none font-medium tracking-[0.14em] uppercase sm:text-[2.2rem]'>
              Void
            </span>
            <span className='annot-xs mt-2 block tracking-[0.3em]'>Ref. X-500 · Not drawn</span>
          </div>
          <h1 id='error-title' className='heading text-[1.75rem] sm:text-[2.25rem]'>
            This sheet did not draw.
          </h1>
          <p className='body-copy mt-3 max-w-md'>
            Something went wrong on our side. Try again, and if it keeps happening, start from the
            home page.
          </p>
          {import.meta.env.DEV && error instanceof Error ? (
            <pre className='mono mt-6 max-w-full overflow-x-auto border border-rule px-3 py-2 text-left text-[0.8125rem] text-ink-muted'>
              {error.message}
            </pre>
          ) : null}
          <div className='mt-8 flex flex-wrap justify-center gap-3'>
            <button type='button' className='btn btn-primary' onClick={() => router.invalidate()}>
              Try again
            </button>
            <Link to='/' className='btn btn-secondary'>
              Home
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

import { Sheet, sheetPad } from '~/components/blueprint/Sheet';
import { ScreenSlot } from '~/components/screens/ScreenSlot';
import { developers } from '~/content/home';
import { AnnotatedCode } from './AnnotatedCode';

export function DevExperience() {
  const { migration } = developers;
  return (
    <Sheet id={developers.id} meta={developers.sheet} eyebrow={developers.eyebrow} labelledBy='dev-title'>
      <div className={`grid gap-6 pt-10 pb-10 lg:grid-cols-12 ${sheetPad}`}>
        <h2 id='dev-title' className='heading text-[2rem] sm:text-[2.75rem] lg:col-span-6'>
          {developers.headline}
        </h2>
        <p className='body-copy self-end lg:col-span-5 lg:col-start-8'>{developers.intro}</p>
      </div>

      <div className={`space-y-14 pb-12 ${sheetPad}`}>
        <AnnotatedCode
          title={developers.sql.title}
          caption={developers.sql.caption}
          lines={developers.sql.lines}
          callouts={developers.sql.callouts}
          lang='sql'
        />
        <AnnotatedCode
          title={developers.client.title}
          caption={developers.client.caption}
          lines={developers.client.lines}
          callouts={developers.client.callouts}
          lang='ts'
          flip
        />
      </div>

      <div className={`border-t border-ink pt-10 pb-12 ${sheetPad}`}>
        <div className='flex flex-wrap items-baseline justify-between gap-3'>
          <h3 className='heading text-[1.5rem] sm:text-[1.875rem]'>{migration.headline}</h3>
          <span className='annot text-ink-muted'>{migration.figure}</span>
        </div>
        <ol className='mt-8 grid border-t border-l border-ink md:grid-cols-2 xl:grid-cols-4'>
          {migration.steps.map((step, i) => (
            <li key={step.name} className='relative flex flex-col border-r border-b border-ink'>
              <div className='flex items-center gap-3 border-b border-rule px-4 py-3'>
                <span className='callout'>{i + 1}</span>
                <h4 className='text-[1.125rem] font-[520] tracking-[-0.01em]'>{step.name}</h4>
                {i < migration.steps.length - 1 ? (
                  <svg
                    width='26'
                    height='10'
                    viewBox='0 0 26 10'
                    aria-hidden='true'
                    className='absolute top-[1.15rem] -right-[14px] z-10 hidden bg-paper xl:block'
                  >
                    <path d='M0 5H24' stroke='var(--ink)' markerEnd='url(#arrow-ink)' />
                  </svg>
                ) : null}
              </div>
              <p className='body-copy flex-1 px-4 py-4 text-[0.9375rem]'>{step.text}</p>
              <div className='px-4 pb-4'>
                <div className='relative flex h-6 items-center' aria-hidden='true'>
                  <span className='absolute inset-y-1 left-0 w-px bg-ink' />
                  <span className='absolute inset-y-1 right-0 w-px bg-ink' />
                  <span className='absolute right-[1px] left-[1px] h-px bg-ink' />
                  <svg width='8' height='6' className='absolute left-[1px]'><path d='M0 3L8 0V6Z' fill='var(--ink)' /></svg>
                  <svg width='8' height='6' className='absolute right-[1px]'><path d='M8 3L0 0V6Z' fill='var(--ink)' /></svg>
                </div>
                <p className='annot mt-1 text-center text-ink-blue'>
                  <span className='sr-only'>Takes </span>
                  {step.duration}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className='mt-10 lg:mx-auto lg:max-w-[52rem]'>
          <ScreenSlot name='migrateCli' caption={developers.screen.caption} />
        </div>
      </div>
    </Sheet>
  );
}

import { useId, useRef, useState, type FormEvent } from 'react';
import { Sheet, sheetPad } from '~/components/blueprint/Sheet';
import { designPartners, regionOptions } from '~/content/home';
import type { RegionId } from '~/content/topology';
import { DATA_SIZES, validate, type Field, type SubmitResult } from '~/lib/design-partner';
import { cn } from '~/lib/utils';
import { applyAsDesignPartner } from '~/server/design-partner.functions';

const copy = designPartners.form;

type Values = { email: string; company: string; regions: RegionId[]; dataSize: string; website: string };
type Phase =
  | { kind: 'idle' }
  | { kind: 'sending' }
  | { kind: 'done'; email: string; company: string }
  | { kind: 'duplicate'; email: string }
  | { kind: 'rate_limited' }
  | { kind: 'failed' };

export function DesignPartners() {
  return (
    <Sheet id={designPartners.id} meta={designPartners.sheet} eyebrow={designPartners.eyebrow} labelledBy='dp-title'>
      <div className={`grid gap-10 pt-10 pb-12 lg:grid-cols-12 ${sheetPad}`}>
        <div className='lg:col-span-5'>
          <h2 id='dp-title' className='heading text-[2.25rem] sm:text-[3rem]'>
            {designPartners.headline}
          </h2>
          <p className='lede mt-5'>{designPartners.intro}</p>
          <ol className='mt-8 border-t border-ink'>
            {designPartners.offers.map((offer, i) => (
              <li key={offer} className='flex gap-4 border-b border-ink py-4'>
                <span className='callout'>{i + 1}</span>
                <span className='text-[1.0625rem] leading-snug'>{offer}</span>
              </li>
            ))}
          </ol>
        </div>
        <div className='lg:col-span-6 lg:col-start-7'>
          <ApplicationForm />
        </div>
      </div>
    </Sheet>
  );
}

function ApplicationForm() {
  const [values, setValues] = useState<Values>({ email: '', company: '', regions: [], dataSize: '', website: '' });
  const [errors, setErrors] = useState<Field[]>([]);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const formRef = useRef<HTMLFormElement>(null);
  const statusRef = useRef<HTMLDivElement>(null);
  const ids = { email: useId(), company: useId(), regions: useId(), dataSize: useId(), status: useId() };

  const set = <K extends keyof Values>(key: K, value: Values[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
    if (errors.length) setErrors((e) => e.filter((f) => f !== key));
  };

  const focusFirst = (fields: Field[]) => {
    const first = fields[0];
    const el = formRef.current?.querySelector<HTMLElement>(`[data-field="${first}"]`);
    el?.focus();
  };

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (phase.kind === 'sending') return;
    const check = validate(values);
    if (!check.ok) {
      setErrors(check.fields);
      focusFirst(check.fields);
      return;
    }
    setErrors([]);
    setPhase({ kind: 'sending' });
    let result: SubmitResult;
    try {
      result = await applyAsDesignPartner({ data: values });
    } catch {
      setPhase({ kind: 'failed' });
      requestAnimationFrame(() => statusRef.current?.focus());
      return;
    }
    if (result.status === 'ok') setPhase({ kind: 'done', email: check.value.email, company: check.value.company });
    else if (result.status === 'duplicate') setPhase({ kind: 'duplicate', email: result.email });
    else if (result.status === 'rate_limited') setPhase({ kind: 'rate_limited' });
    else {
      setPhase({ kind: 'idle' });
      setErrors(result.fields);
      focusFirst(result.fields);
      return;
    }
    requestAnimationFrame(() => statusRef.current?.focus());
  }

  if (phase.kind === 'done' || phase.kind === 'duplicate') {
    const done = phase.kind === 'done';
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        role='status'
        className='relative border border-ink bg-paper outline-none'
      >
        <FormHead />
        <div className='px-5 py-10 sm:px-8'>
          <div className='stamp inline-block -rotate-3 border-[3px] border-double border-ink-blue px-4 py-2 text-ink-blue'>
            <span className='mono text-[1.25rem] font-medium tracking-[0.14em] uppercase'>
              {done ? 'Received' : 'On file'}
            </span>
          </div>
          <h3 className='heading mt-6 text-[1.75rem]'>{done ? copy.success.title : copy.duplicate.title}</h3>
          <p className='body-copy mt-2 max-w-md'>
            {done ? copy.success.body : copy.duplicate.body.replace('{email}', phase.email)}
          </p>
          {done ? (
            <dl className='mono mt-6 grid gap-y-1 border-t border-rule pt-4 text-[0.8125rem] sm:grid-cols-[7rem_1fr]'>
              <dt className='annot-xs pt-0.5 text-ink-muted'>{copy.email}</dt>
              <dd className='mb-2 break-all sm:mb-0'>{phase.email}</dd>
              <dt className='annot-xs pt-0.5 text-ink-muted'>{copy.company}</dt>
              <dd>{phase.company}</dd>
            </dl>
          ) : null}
        </div>
      </div>
    );
  }

  const sending = phase.kind === 'sending';
  const has = (f: Field) => errors.includes(f);
  const errorId = (f: Field) => `${ids[f]}-error`;

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className='border border-ink bg-paper' aria-describedby={ids.status}>
      <FormHead />
      <div className='space-y-6 px-5 py-6 sm:px-6'>
        <div ref={statusRef} id={ids.status} tabIndex={-1} aria-live='polite' className='outline-none empty:hidden'>
          {phase.kind === 'failed' ? <Notice>{copy.failed}</Notice> : null}
          {phase.kind === 'rate_limited' ? <Notice>{copy.rateLimited}</Notice> : null}
          {errors.length > 0 ? <Notice>{copy.fixErrors}</Notice> : null}
        </div>

        <div>
          <Label htmlFor={ids.email} n={1}>
            {copy.email}
          </Label>
          <input
            id={ids.email}
            data-field='email'
            type='email'
            name='email'
            autoComplete='email'
            inputMode='email'
            required
            maxLength={254}
            value={values.email}
            onChange={(e) => set('email', e.target.value)}
            aria-invalid={has('email') || undefined}
            aria-describedby={has('email') ? errorId('email') : `${ids.email}-hint`}
            className={inputClass(has('email'))}
            placeholder='ada@company.com'
          />
          {has('email') ? (
            <FieldError id={errorId('email')}>{copy.errors.email}</FieldError>
          ) : (
            <p id={`${ids.email}-hint`} className='annot-xs mt-1.5 text-ink-muted'>
              {copy.emailHint}
            </p>
          )}
        </div>

        <div>
          <Label htmlFor={ids.company} n={2}>
            {copy.company}
          </Label>
          <input
            id={ids.company}
            data-field='company'
            type='text'
            name='company'
            autoComplete='organization'
            required
            maxLength={120}
            value={values.company}
            onChange={(e) => set('company', e.target.value)}
            aria-invalid={has('company') || undefined}
            aria-describedby={has('company') ? errorId('company') : undefined}
            className={inputClass(has('company'))}
          />
          {has('company') ? <FieldError id={errorId('company')}>{copy.errors.company}</FieldError> : null}
        </div>

        <fieldset aria-describedby={has('regions') ? errorId('regions') : `${ids.regions}-hint`}>
          <legend className='flex items-center gap-2.5'>
            <span className='callout'>3</span>
            <span className='annot'>{copy.regions}</span>
          </legend>
          <p id={`${ids.regions}-hint`} className='annot-xs mt-1.5 text-ink-muted'>
            {copy.regionsHint}
          </p>
          <div className='mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3'>
            {regionOptions.map((r, i) => {
              const checked = values.regions.includes(r.id);
              return (
                <label key={r.id} className={chipClass(checked, has('regions'))}>
                  <input
                    type='checkbox'
                    name='regions'
                    value={r.id}
                    data-field={i === 0 ? 'regions' : undefined}
                    checked={checked}
                    onChange={() =>
                      set('regions', checked ? values.regions.filter((x) => x !== r.id) : [...values.regions, r.id])
                    }
                    className='sr-only'
                  />
                  <Box checked={checked} />
                  <span className='text-[0.9375rem]'>{r.label}</span>
                </label>
              );
            })}
          </div>
          {has('regions') ? <FieldError id={errorId('regions')}>{copy.errors.regions}</FieldError> : null}
        </fieldset>

        <fieldset aria-describedby={has('dataSize') ? errorId('dataSize') : undefined}>
          <legend className='flex items-center gap-2.5'>
            <span className='callout'>4</span>
            <span className='annot'>{copy.dataSize}</span>
          </legend>
          <div className='mt-3 grid grid-cols-2 gap-2'>
            {DATA_SIZES.map((d, i) => {
              const checked = values.dataSize === d.id;
              return (
                <label key={d.id} className={chipClass(checked, has('dataSize'))}>
                  <input
                    type='radio'
                    name='dataSize'
                    value={d.id}
                    data-field={i === 0 ? 'dataSize' : undefined}
                    checked={checked}
                    onChange={() => set('dataSize', d.id)}
                    className='sr-only'
                  />
                  <Dot checked={checked} />
                  <span className='text-[0.9375rem] whitespace-nowrap'>{d.label}</span>
                </label>
              );
            })}
          </div>
          {has('dataSize') ? <FieldError id={errorId('dataSize')}>{copy.errors.dataSize}</FieldError> : null}
        </fieldset>

        {/* Honeypot: off-screen and skipped by keyboard and screen readers. */}
        <div aria-hidden='true' className='absolute -left-[9999px] h-px w-px overflow-hidden'>
          <label>
            Website
            <input
              type='text'
              name='website'
              tabIndex={-1}
              autoComplete='off'
              value={values.website}
              onChange={(e) => set('website', e.target.value)}
            />
          </label>
        </div>

        <button type='submit' className='btn btn-primary w-full' disabled={sending} aria-disabled={sending}>
          {sending ? copy.submitting : copy.submit}
        </button>
      </div>
    </form>
  );
}

function FormHead() {
  return (
    <div className='flex h-10 items-center justify-between border-b border-ink px-5 sm:px-6'>
      <span className='annot'>{copy.title}</span>
      <span className='annot-xs text-ink-muted'>Form DP-07 · 4 fields</span>
    </div>
  );
}

function Label({ htmlFor, n, children }: { htmlFor: string; n: number; children: string }) {
  return (
    <label htmlFor={htmlFor} className='mb-2 flex items-center gap-2.5'>
      <span className='callout'>{n}</span>
      <span className='annot'>{children}</span>
    </label>
  );
}

function Notice({ children }: { children: string }) {
  return (
    <p className='hatch-ink border border-ink'>
      <span className='block bg-paper/90 px-3 py-2.5 text-[0.9375rem] leading-snug'>
        <span className='annot mr-2'>Note</span>
        {children}
      </span>
    </p>
  );
}

function FieldError({ id, children }: { id: string; children: string }) {
  return (
    <p id={id} className='mt-1.5 flex items-start gap-2 text-[0.875rem] leading-snug font-[520]'>
      <svg width='12' height='12' viewBox='0 0 12 12' aria-hidden='true' className='mt-[3px] flex-none'>
        <path d='M1 1L11 11M11 1L1 11' stroke='var(--ink)' strokeWidth='1.5' />
      </svg>
      {children}
    </p>
  );
}

function Box({ checked }: { checked: boolean }) {
  return (
    <span aria-hidden='true' className={cn('grid size-4 flex-none place-items-center border', checked ? 'border-ink-blue bg-ink-blue' : 'border-ink bg-paper')}>
      {checked ? (
        <svg width='10' height='10' viewBox='0 0 10 10'>
          <path d='M1.5 5.2L4 7.6L8.6 2.4' fill='none' stroke='var(--paper)' strokeWidth='1.6' />
        </svg>
      ) : null}
    </span>
  );
}

function Dot({ checked }: { checked: boolean }) {
  return (
    <span aria-hidden='true' className='grid size-4 flex-none place-items-center rounded-full border border-ink bg-paper'>
      {checked ? <span className='size-2 rounded-full bg-ink-blue' /> : null}
    </span>
  );
}

function inputClass(invalid: boolean) {
  return cn(
    'block h-12 w-full border bg-paper px-3 text-[1rem] text-ink placeholder:text-ink-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink-blue',
    invalid ? 'border-2 border-ink' : 'border-ink'
  );
}

function chipClass(checked: boolean, invalid: boolean) {
  return cn(
    'flex min-h-11 cursor-pointer items-center gap-2.5 border px-3 py-2 transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink-blue',
    checked ? 'border-ink-blue bg-paper-deep' : 'border-ink bg-paper hover:bg-paper-deep',
    invalid && !checked && 'border-dashed'
  );
}

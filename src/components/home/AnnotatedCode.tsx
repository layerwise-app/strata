import type { ReactNode } from 'react';
import type { Callout } from '~/content/home';
import { cn } from '~/lib/utils';

const LINE = 24; // px, code line height
const FONT = 13; // px, code font size; Plex Mono advances 0.6 em per character
const PAD_TOP = 14;
const NOTE_GAP = 14;
const HEAD = 41; // panel top border + 40 px title bar

type Lang = 'sql' | 'ts';

/**
 * A code listing drawn like an annotated figure: numbered callouts beside it,
 * with leader lines that land on the exact line they describe.
 */
export function AnnotatedCode({
  title,
  caption,
  lines,
  callouts,
  lang,
  flip = false
}: {
  title: string;
  caption: string;
  lines: string[];
  callouts: Callout[];
  lang: Lang;
  /** Put the callouts on the left. */
  flip?: boolean;
}) {
  const byLine = new Map(callouts.map((c, i) => [c.line, i + 1]));
  const height = PAD_TOP * 2 + lines.length * LINE;
  const notes = placeNotes(callouts);

  return (
    <figure className='min-w-0'>
      <div className={cn('grid grid-cols-[minmax(0,1fr)] md:grid-cols-[minmax(0,1fr)_17rem] lg:grid-cols-[minmax(0,1fr)_20rem]', flip && 'md:grid-cols-[17rem_minmax(0,1fr)] lg:grid-cols-[20rem_minmax(0,1fr)]')}>
        <div className={cn('min-w-0 border border-ink bg-paper', flip && 'md:order-2')}>
          <div className='flex h-10 items-center justify-between border-b border-ink px-3'>
            <span className='annot'>{title}</span>
            <span className='annot-xs text-ink-muted'>{lang === 'sql' ? 'SQL · Postgres 16' : 'TypeScript'}</span>
          </div>
          <div className='relative overflow-x-auto'>
            <pre
              className='mono relative m-0 min-w-max'
              style={{ fontSize: FONT, lineHeight: `${LINE}px`, paddingTop: PAD_TOP, paddingBottom: PAD_TOP, height }}
            >
              <code>
                {lines.map((line, i) => {
                  const n = byLine.get(i + 1);
                  return (
                    <span key={i} className='relative flex'>
                      <span
                        className={cn(
                          'w-10 flex-none border-r border-rule pr-3 text-right select-none',
                          n ? 'text-ink-blue' : 'text-ink-muted'
                        )}
                        aria-hidden='true'
                      >
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className='pr-6 pl-4 whitespace-pre'>
                        {highlight(line, lang)}
                        {n ? (
                          <span className='callout ml-3 align-[1px] text-[0.625rem] md:hidden' style={{ width: 18, height: 18 }} aria-label={`Note ${n}`}>
                            {n}
                          </span>
                        ) : null}
                      </span>
                    </span>
                  );
                })}
              </code>
            </pre>
            {/* Leader stubs from the end of each annotated line to the panel edge. */}
            <div className='pointer-events-none absolute inset-0 hidden md:block' aria-hidden='true'>
              {callouts.map((c) => {
                const y = PAD_TOP + (c.line - 1) * LINE + LINE / 2;
                const len = lines[c.line - 1].length;
                return flip ? (
                  <span
                    key={c.line}
                    className='absolute left-0 h-px bg-ink'
                    style={{ top: y, width: 'calc(2.5rem + 0.75rem)' }}
                  >
                    <span className='absolute top-1/2 right-0 size-[5px] translate-x-1/2 -translate-y-1/2 rounded-full bg-ink' />
                  </span>
                ) : (
                  <span
                    key={c.line}
                    className='absolute right-0 h-px bg-ink'
                    style={{ top: y, left: `calc(2.5rem + 1rem + ${len * 0.6 * FONT}px + 10px)` }}
                  >
                    <span className='absolute top-1/2 left-0 size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-ink' />
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Callout notes with knees that join the stubs. */}
        <ol className={cn('relative hidden md:block', flip && 'md:order-1')} style={{ height: height + HEAD }}>
          {notes.map((note, i) => {
            const lineY = HEAD + PAD_TOP + (note.line - 1) * LINE + LINE / 2;
            const noteY = note.y + HEAD;
            return (
              <li key={note.line} className='absolute right-0 left-0' style={{ top: 0 }}>
                <svg
                  className='absolute top-0 overflow-visible'
                  style={flip ? { right: 0 } : { left: 0 }}
                  width='40'
                  height={Math.max(lineY, noteY) + 2}
                  aria-hidden='true'
                >
                  {flip ? (
                    <path d={`M40 ${lineY}H26L14 ${noteY + 11}H6`} fill='none' stroke='var(--ink)' strokeWidth='1' />
                  ) : (
                    <path d={`M0 ${lineY}H14L26 ${noteY + 11}H34`} fill='none' stroke='var(--ink)' strokeWidth='1' />
                  )}
                </svg>
                <div
                  className={cn('absolute flex gap-3', flip ? 'right-10 left-0 flex-row-reverse text-right' : 'right-0 left-[34px]')}
                  style={{ top: noteY }}
                >
                  <span className='callout bg-paper'>{i + 1}</span>
                  <p className='text-[0.9375rem] leading-[1.45]'>{note.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
      <figcaption className={cn('annot mt-3 text-ink-muted', flip && 'md:text-right')}>{caption}</figcaption>

      {/* Phones and narrow tablets: the notes as a numbered list. */}
      <ol className='mt-4 space-y-3 md:hidden'>
        {callouts.map((c, i) => (
          <li key={c.line} className='flex gap-3'>
            <span className='callout'>{i + 1}</span>
            <p className='text-[0.9375rem] leading-[1.45]'>
              <span className='annot-xs mr-2 text-ink-blue'>Line {String(c.line).padStart(2, '0')}</span>
              {c.text}
            </p>
          </li>
        ))}
      </ol>
    </figure>
  );
}

/** Stack notes near their lines without letting them overlap. */
function placeNotes(callouts: Callout[]) {
  let floor = -Infinity;
  return callouts.map((c) => {
    const ideal = PAD_TOP + (c.line - 1) * LINE + LINE / 2 - 11;
    const y = Math.max(ideal, floor);
    // Rough height: ~34 characters a line at 15 px in a 20 rem column.
    const rows = Math.ceil(c.text.length / 34);
    floor = y + rows * 22 + NOTE_GAP;
    return { ...c, y };
  });
}

const SQL_KEYWORDS =
  /\b(CREATE|TABLE|PRIMARY|KEY|DEFAULT|NOT|NULL|WITH|SET|SELECT|FROM|WHERE|BEGIN|UPDATE|COMMIT|FOR)\b/;
const SQL_TYPES = /\b(uuid|jsonb|timestamptz)\b/;
const TS_KEYWORDS = /\b(import|from|const|export|async|function|return|await)\b/;

function highlight(line: string, lang: Lang): ReactNode[] {
  const out: ReactNode[] = [];
  const re = lang === 'sql'
    ? /('(?:[^']|'')*')|(\$\d+)|([A-Za-z_][\w.]*)|([^A-Za-z_'$]+|\$)/g
    : /('(?:[^'\\]|\\.)*')|(\b\d+\b)|([A-Za-z_$][\w$]*)|([^A-Za-z_$']+)/g;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(line))) {
    const [tok, str, num, word] = m;
    let cls = '';
    if (str) cls = 'text-ink';
    else if (num) cls = 'text-ink-blue-deep';
    else if (word) {
      if (lang === 'sql' && SQL_KEYWORDS.test(word) && word === word.toUpperCase()) cls = 'text-ink-blue font-medium';
      else if (lang === 'sql' && SQL_TYPES.test(word)) cls = 'text-ink-muted';
      else if (lang === 'ts' && TS_KEYWORDS.test(word)) cls = 'text-ink-blue font-medium';
      else cls = 'text-ink';
    } else cls = 'text-ink-muted';
    out.push(
      <span key={i++} className={cn(cls, str && 'italic')}>
        {tok}
      </span>
    );
  }
  return out;
}

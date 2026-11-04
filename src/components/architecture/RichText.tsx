import { Fragment } from 'react';

/** Plain text with `inline code` in backticks. */
export function RichText({ text }: { text: string }) {
  const parts = text.split('`');
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <code key={i} className='mono rounded-none bg-paper-deep px-1 py-px text-[0.875em] text-ink'>
            {part}
          </code>
        ) : (
          <Fragment key={i}>{part}</Fragment>
        )
      )}
    </>
  );
}

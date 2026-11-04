import { useId } from 'react';

/**
 * The Strata mark: three strata cut by a fault, the right side displaced and
 * still continuous. Matches public/logo.svg.
 */
export function LogoMark({ size = 28, className }: { size?: number; className?: string }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg
      viewBox='0 0 64 64'
      width={size}
      height={size}
      className={className}
      aria-hidden='true'
      focusable='false'
    >
      <defs>
        <clipPath id={`${id}l`}>
          <path d='M0 0H37L27 64H0Z' />
        </clipPath>
        <clipPath id={`${id}r`}>
          <path d='M41 0H64V64H31Z' />
        </clipPath>
        <pattern
          id={`${id}h`}
          width='3'
          height='3'
          patternUnits='userSpaceOnUse'
          patternTransform='rotate(45)'
        >
          <rect width='1.15' height='3' fill='var(--paper, #f4f2ec)' />
        </pattern>
      </defs>
      <rect width='64' height='64' fill='var(--ink-blue, #1f45b5)' />
      <g clipPath={`url(#${id}l)`}>
        <Bands id={id} />
      </g>
      <g clipPath={`url(#${id}r)`}>
        <g transform='translate(0 7)'>
          <Bands id={id} />
        </g>
      </g>
    </svg>
  );
}

function Bands({ id }: { id: string }) {
  return (
    <>
      <rect x='9' y='11' width='46' height='9' fill='var(--paper, #f4f2ec)' />
      <rect
        x='9.6'
        y='26.6'
        width='44.8'
        height='7.8'
        fill={`url(#${id}h)`}
        stroke='var(--paper, #f4f2ec)'
        strokeWidth='1.2'
      />
      <rect x='9' y='41' width='46' height='9' fill='var(--paper, #f4f2ec)' />
    </>
  );
}

/**
 * Shared SVG definitions: arrowheads for dimension lines and hatch patterns
 * for cut-away surfaces. Rendered once per page; figures refer to the ids.
 */
export function BlueprintDefs() {
  return (
    <svg width='0' height='0' aria-hidden='true' focusable='false' className='absolute'>
      <defs>
        <marker id='arrow-ink' viewBox='0 0 10 6' refX='10' refY='3' markerWidth='10' markerHeight='6' orient='auto-start-reverse' markerUnits='userSpaceOnUse'>
          <path d='M0 0L10 3L0 6Z' fill='var(--ink)' />
        </marker>
        <marker id='arrow-blue' viewBox='0 0 10 6' refX='10' refY='3' markerWidth='10' markerHeight='6' orient='auto-start-reverse' markerUnits='userSpaceOnUse'>
          <path d='M0 0L10 3L0 6Z' fill='var(--ink-blue)' />
        </marker>
        <marker id='dot-ink' viewBox='0 0 6 6' refX='3' refY='3' markerWidth='6' markerHeight='6' markerUnits='userSpaceOnUse'>
          <circle cx='3' cy='3' r='2' fill='var(--ink)' />
        </marker>
        <marker id='dot-blue' viewBox='0 0 6 6' refX='3' refY='3' markerWidth='6' markerHeight='6' markerUnits='userSpaceOnUse'>
          <circle cx='3' cy='3' r='2' fill='var(--ink-blue)' />
        </marker>
        <pattern id='hatch-blue' width='6' height='6' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'>
          <line x1='0' y1='0' x2='0' y2='6' stroke='var(--ink-blue)' strokeWidth='1' />
        </pattern>
        <pattern id='hatch-ink' width='5' height='5' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'>
          <line x1='0' y1='0' x2='0' y2='5' stroke='var(--ink)' strokeWidth='0.9' />
        </pattern>
        <pattern id='hatch-cross' width='6' height='6' patternUnits='userSpaceOnUse' patternTransform='rotate(45)'>
          <path d='M0 0V6M0 0H6' stroke='var(--ink)' strokeWidth='0.8' />
        </pattern>
      </defs>
    </svg>
  );
}

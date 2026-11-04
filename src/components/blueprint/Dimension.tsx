/** SVG dimension line with extension lines, arrowheads and a label. */
export function DimensionH({
  x1,
  x2,
  y,
  label,
  ext = 8,
  color = 'ink',
  labelAbove = true
}: {
  x1: number;
  x2: number;
  y: number;
  label?: string;
  /** Length of the extension lines above and below. */
  ext?: number;
  color?: 'ink' | 'blue';
  labelAbove?: boolean;
}) {
  const stroke = color === 'blue' ? 'var(--ink-blue)' : 'var(--ink)';
  const left = Math.min(x1, x2);
  const right = Math.max(x1, x2);
  const tight = right - left < 22;
  return (
    <g>
      <line x1={x1} x2={x1} y1={y - ext} y2={y + ext} stroke={stroke} strokeWidth='1' />
      <line x1={x2} x2={x2} y1={y - ext} y2={y + ext} stroke={stroke} strokeWidth='1' />
      {tight ? (
        <line x1={left} x2={right} y1={y} y2={y} stroke={stroke} strokeWidth='1' />
      ) : (
        <line
          x1={left + 0.5}
          x2={right - 0.5}
          y1={y}
          y2={y}
          stroke={stroke}
          strokeWidth='1'
          markerStart={`url(#arrow-${color})`}
          markerEnd={`url(#arrow-${color})`}
        />
      )}
      {label ? (
        <text
          x={(left + right) / 2}
          y={labelAbove ? y - 5 : y + 13}
          textAnchor='middle'
          fontSize='10'
          fill={stroke}
        >
          {label}
        </text>
      ) : null}
    </g>
  );
}

/** Numbered callout circle for SVG figures. */
export function CalloutMark({ x, y, n, r = 9 }: { x: number; y: number; n: number | string; r?: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill='var(--paper)' stroke='var(--ink)' strokeWidth='1' />
      <text x={x} y={y + 3.5} textAnchor='middle' fontSize='10' fill='var(--ink)' style={{ letterSpacing: 0 }}>
        {n}
      </text>
    </g>
  );
}

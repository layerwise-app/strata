import type { ComponentType, ReactNode } from 'react';
import { CalloutMark, DimensionH } from '~/components/blueprint/Dimension';
import type { DiagramKey } from '~/content/architecture';
import { quorumPeers, regions, rttBetween } from '~/content/topology';

/** Every drawn diagram an Architecture section can name. */
export const diagrams: Record<DiagramKey, ComponentType> = {
  'serializable-timeline': SerializableTimeline,
  'quorum-write': QuorumWrite,
  'local-reads': LocalReads,
  'failover-timeline': FailoverTimeline,
  partition: Partition
};

function Frame({ w, h, label, children }: { w: number; h: number; label: string; children: ReactNode }) {
  return (
    <div className='overflow-x-auto'>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className='draw block h-auto w-full min-w-[620px]'
        role='img'
        aria-label={label}
      >
        {children}
      </svg>
    </div>
  );
}

const ink = 'var(--ink)';
const blue = 'var(--ink-blue)';
const muted = 'var(--ink-muted)';

// ── B-01 ───────────────────────────────────────────────────────────────────
function SerializableTimeline() {
  const x = (ms: number) => 120 + ms * 0.72; // 0..1000 ms → 120..840
  return (
    <Frame
      w={900}
      h={300}
      label='Timeline: transaction T1 in Frankfurt commits at 610 ms. T2 in Singapore reads at 540 ms, inside T1’s uncertainty window, so it restarts at 640 ms and sees T1’s write.'
    >
      {/* Lanes */}
      {[
        { y: 90, name: 'FRA', sub: 'T1 · write' },
        { y: 190, name: 'SIN', sub: 'T2 · read' }
      ].map((lane) => (
        <g key={lane.name}>
          <text x='20' y={lane.y - 4} fontSize='12' fill={blue}>{lane.name}</text>
          <text x='20' y={lane.y + 12} fontSize='10' fill={muted}>{lane.sub}</text>
          <line x1='110' x2='860' y1={lane.y} y2={lane.y} stroke={ink} strokeOpacity='0.35' />
        </g>
      ))}
      {/* T1 */}
      <rect x={x(180)} y='76' width={x(610) - x(180)} height='28' fill='url(#hatch-blue)' stroke={blue} />
      <circle cx={x(610)} cy='90' r='5' fill={blue} />
      <text x={x(610) + 10} y='70' fontSize='10' fill={blue}>Commit ts 610</text>
      <text x={x(180)} y='66' fontSize='10' fill={ink}>Begin</text>
      {/* Uncertainty window around T2's first read */}
      <rect x={x(540)} y='160' width={x(790) - x(540)} height='60' fill='url(#hatch-ink)' opacity='0.5' />
      <line x1={x(540)} x2={x(540)} y1='150' y2='230' stroke={ink} strokeDasharray='3 3' />
      <line x1={x(790)} x2={x(790)} y1='150' y2='230' stroke={ink} strokeDasharray='3 3' />
      <circle cx={x(540)} cy='190' r='5' fill='var(--paper)' stroke={ink} />
      <text x={x(540) - 6} y='246' fontSize='10' fill={ink} textAnchor='end'>Read at 540</text>
      {/* restart */}
      <path d={`M${x(540)} 182 C ${x(580)} 140, ${x(620)} 140, ${x(640)} 182`} fill='none' stroke={ink} markerEnd='url(#arrow-ink)' />
      <circle cx={x(640)} cy='190' r='5' fill={ink} />
      <text x={x(640) + 10} y='208' fontSize='10' fill={ink}>Restart at 640 · sees T1</text>
      {/* T1's write visible to T2 */}
      <line x1={x(610)} x2={x(610)} y1='96' y2='184' stroke={blue} strokeDasharray='2 3' />
      <DimensionH x1={x(540)} x2={x(790)} y={140} label='Uncertainty ε ≤ 250 ms' />
      {/* axis */}
      <line x1='110' x2='860' y1='272' y2='272' stroke={ink} markerEnd='url(#arrow-ink)' />
      {[0, 200, 400, 600, 800, 1000].map((ms) => (
        <g key={ms}>
          <line x1={x(ms)} x2={x(ms)} y1='268' y2='276' stroke={ink} />
          <text x={x(ms)} y='292' fontSize='9' fill={muted} textAnchor='middle'>{ms}</text>
        </g>
      ))}
      <text x='866' y='276' fontSize='9' fill={muted}>HLC ms</text>
      <CalloutMark x={x(610)} y={40} n={1} />
      <CalloutMark x={x(640) + 30} y={170} n={2} />
    </Frame>
  );
}

// ── B-02 ───────────────────────────────────────────────────────────────────
function QuorumWrite() {
  const leader = 'fra' as const;
  const peers = quorumPeers(leader);
  const others = regions.filter((r) => r.id !== leader);
  const cols = [{ id: 'client', code: 'CLIENT', sub: 'London' }, { id: leader, code: 'FRA', sub: 'Leader' }, ...others.map((r) => ({ id: r.id, code: r.code, sub: peers.includes(r.id) ? 'Quorum' : 'Follower' }))];
  const cx = (i: number) => 70 + i * 128;
  const y = (ms: number) => 90 + ms * 0.95; // ms after the leader appends
  const commitAt = Math.max(...peers.map((p) => rttBetween(leader, p)));
  return (
    <Frame
      w={960}
      h={430}
      label={`Sequence: the Frankfurt leader sends a write to five regions. Virginia answers at 90 ms and Oregon at 150 ms, so the write commits at ${commitAt} ms; the other regions catch up later.`}
    >
      {cols.map((c, i) => (
        <g key={c.id}>
          <rect x={cx(i) - 44} y='18' width='88' height='40' fill='var(--paper)' stroke={ink} />
          <text x={cx(i)} y='36' fontSize='12' textAnchor='middle' fill={c.id === leader ? blue : ink}>{c.code}</text>
          <text x={cx(i)} y='50' fontSize='9' textAnchor='middle' fill={muted}>{c.sub}</text>
          <line x1={cx(i)} x2={cx(i)} y1='58' y2='410' stroke={ink} strokeOpacity='0.35' strokeDasharray='4 4' />
        </g>
      ))}
      {/* client → leader */}
      <line x1={cx(0)} x2={cx(1) - 2} y1='74' y2='86' stroke={ink} markerEnd='url(#arrow-ink)' />
      <text x={cx(0) + 6} y='70' fontSize='9' fill={ink}>COMMIT</text>
      <rect x={cx(1) - 5} y='88' width='10' height={y(commitAt) - 88} fill='url(#hatch-blue)' stroke={blue} />
      {others.map((r, idx) => {
        const i = idx + 2;
        const rtt = rttBetween(leader, r.id);
        const inQuorum = peers.includes(r.id);
        const arrive = y(rtt / 2);
        const back = y(rtt);
        return (
          <g key={r.id}>
            <line x1={cx(1)} x2={cx(i) - 2} y1={y(0)} y2={arrive} stroke={blue} markerEnd='url(#arrow-blue)' strokeOpacity={inQuorum ? 1 : 0.55} />
            <line x1={cx(i)} x2={cx(1) + 6} y1={arrive} y2={back} stroke={ink} strokeDasharray={inQuorum ? undefined : '3 3'} markerEnd='url(#arrow-ink)' strokeOpacity={inQuorum ? 1 : 0.5} />
            <text x={cx(i) + 8} y={arrive + 3} fontSize='9' fill={inQuorum ? ink : muted}>{rtt} ms</text>
          </g>
        );
      })}
      {/* commit */}
      <line x1={cx(1) - 60} x2={cx(cols.length - 1) + 50} y1={y(commitAt)} y2={y(commitAt)} stroke={blue} strokeDasharray='8 3 2 3' />
      <text x={cx(cols.length - 1) + 50} y={y(commitAt) - 6} fontSize='10' textAnchor='end' fill={blue}>Commit: 3 of 6 hold it</text>
      <line x1={cx(1) - 2} x2={cx(0) + 2} y1={y(commitAt) + 4} y2={y(commitAt) + 16} stroke={ink} markerEnd='url(#arrow-ink)' />
      <text x={cx(0) + 4} y={y(commitAt) + 30} fontSize='9' fill={ink}>OK</text>
      {/* dimension: commit wait */}
      <g transform={`translate(${cx(1) - 30} 0)`}>
        <line x1='0' x2='0' y1={y(0) + 1} y2={y(commitAt) - 1} stroke={ink} markerStart='url(#arrow-ink)' markerEnd='url(#arrow-ink)' />
        <text x='-8' y={(y(0) + y(commitAt)) / 2} fontSize='10' fill={ink} textAnchor='end'>{commitAt} ms</text>
      </g>
      <text x={cx(cols.length - 1) + 50} y='404' fontSize='9' textAnchor='end' fill={muted}>Dashed: catches up after commit</text>
    </Frame>
  );
}

// ── B-03 ───────────────────────────────────────────────────────────────────
function LocalReads() {
  const x = (s: number) => 840 - s * 260; // seconds before now
  return (
    <Frame
      w={900}
      h={300}
      label='Timeline: the Singapore follower’s closed timestamp trails now by 0.38 s. A read at now minus 2 s is older than the closed timestamp, so the follower serves it locally to a client in Jakarta in 14 ms.'
    >
      {[
        { y: 80, name: 'VIR', sub: 'Leader' },
        { y: 170, name: 'SIN', sub: 'Follower' }
      ].map((lane) => (
        <g key={lane.name}>
          <text x='20' y={lane.y - 4} fontSize='12' fill={blue}>{lane.name}</text>
          <text x='20' y={lane.y + 12} fontSize='10' fill={muted}>{lane.sub}</text>
          <line x1='110' x2='850' y1={lane.y} y2={lane.y} stroke={ink} strokeOpacity='0.35' />
        </g>
      ))}
      {/* leader log entries */}
      {Array.from({ length: 26 }, (_, i) => (
        <rect key={i} x={130 + i * 27} y='70' width='14' height='20' fill={i < 24 ? blue : 'none'} stroke={blue} />
      ))}
      {/* follower has entries up to closed ts */}
      {Array.from({ length: 26 }, (_, i) => (
        <rect key={i} x={130 + i * 27} y='160' width='14' height='20' fill={130 + i * 27 < x(0.38) ? 'url(#hatch-blue)' : 'none'} stroke={blue} strokeOpacity={130 + i * 27 < x(0.38) ? 1 : 0.35} />
      ))}
      {/* now */}
      <line x1={x(0)} x2={x(0)} y1='40' y2='250' stroke={ink} />
      <text x={x(0)} y='34' fontSize='10' textAnchor='middle' fill={ink}>Now</text>
      {/* closed ts */}
      <line x1={x(0.38)} x2={x(0.38)} y1='140' y2='250' stroke={blue} strokeWidth='1.5' />
      <text x={x(0.38) - 6} y='136' fontSize='10' textAnchor='end' fill={blue}>Closed ts</text>
      {/* read ts */}
      <line x1={x(2)} x2={x(2)} y1='140' y2='250' stroke={ink} strokeDasharray='4 3' />
      <circle cx={x(2)} cy='170' r='6' fill='var(--paper)' stroke={ink} strokeWidth='1.5' />
      <text x={x(2) - 10} y='136' fontSize='10' textAnchor='end' fill={ink}>Read at now − 2 s</text>
      <DimensionH x1={x(2)} x2={x(0)} y={232} label='Staleness allowed 2 s' />
      <DimensionH x1={x(0.38)} x2={x(0)} y={208} label='Lag 0.38 s' color='blue' />
      {/* client */}
      <rect x='120' y='222' width='150' height='40' fill='var(--paper)' stroke={ink} />
      <text x='195' y='240' fontSize='10' textAnchor='middle' fill={ink}>Client · Jakarta</text>
      <text x='195' y='254' fontSize='9' textAnchor='middle' fill={muted}>Answered in 14 ms</text>
      <path d={`M270 236 C 300 236, ${x(2) - 40} 210, ${x(2) - 7} 176`} fill='none' stroke={ink} markerEnd='url(#arrow-ink)' />
      <CalloutMark x={x(2)} y={110} n={1} />
      <CalloutMark x={x(0.38)} y={110} n={2} />
    </Frame>
  );
}

// ── B-04 ───────────────────────────────────────────────────────────────────
function FailoverTimeline() {
  const x = (ms: number) => 200 + ms * 0.36; // 0..1800 ms → 200..848
  const phases = [
    { name: 'Lease expiry', from: 0, to: 900, note: 'No renewals from FRA' },
    { name: 'Election', from: 900, to: 1200, note: '4 votes · new leader VIR' },
    { name: 'Log tail catch-up', from: 1200, to: 1400, note: 'From a quorum member' },
    { name: 'Client reconnect', from: 1400, to: 1800, note: 'Retry on next nearest' }
  ];
  return (
    <Frame
      w={920}
      h={330}
      label='Failover timeline after Frankfurt goes down: lease expiry 0 to 900 ms, election to 1200 ms, log catch-up to 1400 ms, clients reconnect by 1800 ms. Total 1.8 seconds.'
    >
      {phases.map((p, i) => {
        const y = 40 + i * 52;
        return (
          <g key={p.name}>
            <text x='20' y={y + 16} fontSize='11' fill={ink}>{p.name}</text>
            <line x1='190' x2='870' y1={y + 12} y2={y + 12} stroke={ink} strokeOpacity='0.2' />
            <rect x={x(p.from)} y={y} width={x(p.to) - x(p.from)} height='24' fill='url(#hatch-blue)' stroke={blue} />
            {p.to < 1500 ? (
              <text x={x(p.to) + 8} y={y + 16} fontSize='9' fill={muted}>{p.note}</text>
            ) : (
              <text x={x(p.from) - 8} y={y + 16} fontSize='9' fill={muted} textAnchor='end'>{p.note}</text>
            )}
            <line x1={x(p.to)} x2={x(p.to)} y1={y + 24} y2='262' stroke={ink} strokeDasharray='2 3' strokeOpacity='0.6' />
          </g>
        );
      })}
      {phases.map((p) => (
        <DimensionH key={p.name} x1={x(p.from)} x2={x(p.to)} y={262} label={`${p.to - p.from}`} />
      ))}
      <DimensionH x1={x(0)} x2={x(1800)} y={300} label='Total, median 1.8 s · 0 writes lost' color='blue' ext={10} />
      <line x1={x(0)} x2={x(0)} y1='24' y2='310' stroke={ink} />
      <text x={x(0)} y='18' fontSize='10' textAnchor='middle' fill={ink}>FRA stops answering</text>
      <CalloutMark x={x(1800)} y={24} n={1} />
      <text x={x(1800) - 14} y='28' fontSize='10' textAnchor='end' fill={blue}>First write committed</text>
    </Frame>
  );
}

// ── B-05 ───────────────────────────────────────────────────────────────────
function Partition() {
  const left = [
    { code: 'ORE', x: 110, y: 90 },
    { code: 'VIR', x: 250, y: 70 },
    { code: 'SAO', x: 190, y: 220 },
    { code: 'FRA', x: 380, y: 150 }
  ];
  const right = [
    { code: 'SIN', x: 640, y: 110 },
    { code: 'SYD', x: 760, y: 220 }
  ];
  const zig = 'M520 20L540 60L500 100L540 140L500 180L540 220L500 260L520 300';
  return (
    <Frame
      w={880}
      h={330}
      label='Partition diagram: Oregon, Virginia, São Paulo and Frankfurt on one side keep writing with four regions; Singapore and Sydney on the other side stop writing and serve reads marked stale.'
    >
      <rect x='540' y='14' width='326' height='300' fill='url(#hatch-ink)' opacity='0.28' />
      <path d={zig} fill='none' stroke={ink} strokeWidth='1.5' />
      <text x='520' y='326' fontSize='9' textAnchor='middle' fill={muted}>Break line · network partition</text>
      {/* links within each side */}
      {[
        [0, 1],
        [1, 3],
        [0, 2],
        [1, 2],
        [0, 3]
      ].map(([a, b]) => (
        <line key={`${a}${b}`} x1={left[a].x} y1={left[a].y} x2={left[b].x} y2={left[b].y} stroke={blue} strokeOpacity='0.6' />
      ))}
      <line x1={right[0].x} y1={right[0].y} x2={right[1].x} y2={right[1].y} stroke={blue} strokeOpacity='0.6' />
      {/* severed links */}
      {[
        [left[3], right[0]],
        [left[0], right[1]]
      ].map(([a, b], i) => (
        <g key={i}>
          <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke={ink} strokeDasharray='3 4' strokeOpacity='0.5' />
        </g>
      ))}
      {[...left, ...right].map((n, i) => (
        <g key={n.code}>
          <circle cx={n.x} cy={n.y} r='20' fill='var(--paper)' stroke={i < 4 ? blue : ink} strokeWidth='1.25' />
          <text x={n.x} y={n.y + 4} fontSize='11' textAnchor='middle' fill={i < 4 ? blue : ink}>{n.code}</text>
        </g>
      ))}
      <g>
        <rect x='40' y='262' width='340' height='46' fill='var(--paper)' stroke={blue} />
        <text x='54' y='281' fontSize='11' fill={blue}>4 regions ≥ lease quorum 4</text>
        <text x='54' y='298' fontSize='10' fill={ink}>Keeps writing · leases held or won in 1.8 s</text>
      </g>
      <g>
        <rect x='580' y='262' width='270' height='46' fill='var(--paper)' stroke={ink} />
        <text x='594' y='281' fontSize='11' fill={ink}>2 regions &lt; 4</text>
        <text x='594' y='298' fontSize='10' fill={ink}>Writes stop in 900 ms · stale reads</text>
      </g>
      <CalloutMark x={520} y={40} n={1} />
    </Frame>
  );
}

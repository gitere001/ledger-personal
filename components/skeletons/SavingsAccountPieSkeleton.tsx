// Matches SavingsAccountPie: donut ring with 3 arc segments + centre label + legend
const SEGS = [
  { pct: 0.52, color: '#1e3a5f' },
  { pct: 0.31, color: '#14532d' },
  { pct: 0.14, color: '#78350f' },
]

export default function SavingsAccountPieSkeleton() {
  const cx = 100, cy = 105, r = 62, sw = 28
  const circ = 2 * Math.PI * r
  const gap  = 6
  let offset = 0

  return (
    <div className="flex flex-col h-full animate-pulse">
      <svg viewBox="0 0 200 230" width="100%" style={{ display: 'block' }}>
        {/* Background ring */}
        <circle cx={cx} cy={cy} r={r}
          fill="none" stroke="#1f2937" strokeWidth={sw} />

        {/* Arc segments */}
        {SEGS.map((seg, i) => {
          const dash = seg.pct * circ - gap
          const thisOffset = offset
          offset += seg.pct * circ
          return (
            <circle key={i} cx={cx} cy={cy} r={r}
              fill="none" stroke={seg.color} strokeWidth={sw}
              strokeDasharray={`${dash} ${circ}`}
              strokeDashoffset={-thisOffset}
              transform={`rotate(-90 ${cx} ${cy})`} />
          )
        })}

        {/* Centre: "Total" label + amount */}
        <rect x={cx - 15} y={cy - 13} width={30} height={7} rx={3} fill="#374151" />
        <rect x={cx - 24} y={cy + 3}  width={48} height={11} rx={5} fill="#1f2937" />

        {/* Legend dots + labels */}
        {SEGS.map((seg, i) => (
          <g key={i} transform={`translate(${14 + i * 62}, 198)`}>
            <circle cx={5} cy={5} r={5} fill={seg.color} />
            <rect x={14} y={1} width={34} height={8} rx={4} fill="#1f2937" />
          </g>
        ))}
      </svg>
    </div>
  )
}

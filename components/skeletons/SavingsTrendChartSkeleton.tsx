// Matches SavingsTrendChart: bar groups (blue/green/red) + yellow balance line, height=280
const GROUPS = [
  { dep: 58, int: 4, wit: 0,  bal: 62  },
  { dep: 75, int: 6, wit: 0,  bal: 81  },
  { dep: 55, int: 5, wit: 10, bal: 76  },
  { dep: 80, int: 8, wit: 0,  bal: 97  },
  { dep: 68, int: 7, wit: 4,  bal: 108 },
  { dep: 65, int: 9, wit: 0,  bal: 120 },
]

export default function SavingsTrendChartSkeleton() {
  const W = 560, H = 280
  const pL = 44, pR = 48, pT = 12, pB = 36
  const cW = W - pL - pR
  const cH = H - pT - pB
  const n  = GROUPS.length
  const gW = cW / n
  const bW = 12
  const maxBal = 135

  const linePoints = GROUPS.map(({ bal }, i) => {
    const x = pL + (i + 0.5) * gW
    const y = pT + cH - (bal / maxBal) * cH
    return `${x},${y}`
  }).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}
      className="animate-pulse" style={{ display: 'block' }}>

      {/* Grid */}
      {[0.25, 0.5, 0.75, 1].map((f, i) => (
        <line key={i} x1={pL} y1={pT + f * cH} x2={W - pR} y2={pT + f * cH}
          stroke="#1f2937" strokeWidth="1" strokeDasharray="4 4" />
      ))}

      {/* Bars */}
      {GROUPS.map(({ dep, int, wit }, gi) => {
        const cx = pL + (gi + 0.5) * gW
        return [
          { pct: dep, color: '#1d4ed8', dx: -(bW + 2.5) },
          { pct: int, color: '#15803d', dx: 0 },
          { pct: wit, color: '#991b1b', dx: bW + 2.5 },
        ].map(({ pct, color, dx }, bi) => {
          if (pct === 0) return null
          const h = (pct / 100) * cH
          return (
            <rect key={`${gi}-${bi}`}
              x={cx + dx - bW / 2} y={pT + cH - h}
              width={bW} height={h} rx={2}
              fill={color} opacity={0.65} />
          )
        })
      })}

      {/* Balance line */}
      <polyline points={linePoints} fill="none"
        stroke="#78350f" strokeWidth={2.5}
        strokeLinecap="round" strokeLinejoin="round" />
      {GROUPS.map(({ bal }, i) => (
        <circle key={i}
          cx={pL + (i + 0.5) * gW}
          cy={pT + cH - (bal / maxBal) * cH}
          r={4} fill="#78350f" />
      ))}

      {/* X labels */}
      {GROUPS.map((_, i) => (
        <rect key={i}
          x={pL + (i + 0.5) * gW - 12} y={H - 18}
          width={24} height={7} rx={3} fill="#1f2937" />
      ))}

      {/* Left Y labels */}
      {[0, 1, 2, 3].map(i => (
        <rect key={i} x={2} y={pT + (i * cH) / 3.5 - 3}
          width={30} height={7} rx={3} fill="#1f2937" />
      ))}

      {/* Right Y labels (balance axis — amber tint) */}
      {[0, 1, 2, 3].map(i => (
        <rect key={i} x={W - pR + 6} y={pT + (i * cH) / 3.5 - 3}
          width={32} height={7} rx={3} fill="#78350f40" />
      ))}
    </svg>
  )
}

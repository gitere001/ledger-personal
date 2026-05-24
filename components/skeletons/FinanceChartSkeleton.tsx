// Matches FinanceChart: grouped bars (income=green, expenses=red, savings=blue), height=280
const GROUPS = [
  { income: 0,  expenses: 0,  savings: 0  },
  { income: 0,  expenses: 0,  savings: 0  },
  { income: 55, expenses: 65, savings: 10 },
  { income: 95, expenses: 48, savings: 18 },
  { income: 72, expenses: 32, savings: 34 },
  { income: 8,  expenses: 26, savings: 2  },
]

export default function FinanceChartSkeleton() {
  const W = 560, H = 280
  const pL = 50, pR = 20, pT = 20, pB = 40
  const cW = W - pL - pR
  const cH = H - pT - pB
  const n  = GROUPS.length
  const gW = cW / n

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H}
      className="animate-pulse" style={{ display: 'block' }}>

      {/* Y grid lines */}
      {[0, 0.25, 0.5, 0.75, 1].map((f, i) => (
        <line key={i}
          x1={pL} y1={pT + f * cH}
          x2={W - pR} y2={pT + f * cH}
          stroke="#1f2937" strokeWidth="1" />
      ))}

      {/* Y axis labels */}
      {['100K', '75K', '50K', '25K', '0K'].map((_, i) => (
        <rect key={i} x={2} y={pT + (i / 4) * cH - 4}
          width={38} height={8} rx={4} fill="#1f2937" />
      ))}

      {/* Bars per group */}
      {GROUPS.map((g, gi) => {
        const cx = pL + (gi + 0.5) * gW
        const bW = 18
        const bars = [
          { h: g.expenses, color: '#7f1d1d', offset: -bW - 3 },
          { h: g.income,   color: '#14532d', offset: 0         },
          { h: g.savings,  color: '#1e3a5f', offset: bW + 3   },
        ]
        return bars.map(({ h, color, offset }, bi) => {
          if (h === 0) return null
          const barH = (h / 100) * cH
          return (
            <rect key={`${gi}-${bi}`}
              x={cx + offset - bW / 2} y={pT + cH - barH}
              width={bW} height={barH} rx={3}
              fill={color}
              style={{ animationDelay: `${(gi * 3 + bi) * 55}ms` }} />
          )
        })
      })}

      {/* X axis labels */}
      {GROUPS.map((_, i) => (
        <rect key={i}
          x={pL + (i + 0.5) * gW - 14} y={H - 18}
          width={28} height={8} rx={4} fill="#1f2937"
          style={{ animationDelay: `${i * 70}ms` }} />
      ))}

      {/* Legend */}
      {[
        { color: '#f87171', label: 60 },
        { color: '#4ade80', label: 50 },
        { color: '#60a5fa', label: 52 },
      ].map(({ color, label }, i) => (
        <g key={i} transform={`translate(${W / 2 - 100 + i * 80}, ${H - 6})`}>
          <rect x={0} y={-6} width={10} height={10} rx={2} fill={color} opacity={0.4} />
          <rect x={14} y={-5} width={label} height={8} rx={4} fill="#1f2937" />
        </g>
      ))}
    </svg>
  )
}

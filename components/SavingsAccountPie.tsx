'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'

interface Props {
  accounts: { id: number; name: string; isActive: boolean }[]
  accountTotals: Record<number, { deposited: number; interest: number; withdrawn: number }>
}

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899', '#14b8a6', '#f97316']

const fmt = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)

function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null
  const { name, value, percent } = payload[0]
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5 shadow-xl text-xs space-y-1 min-w-[150px]">
      <p className="text-gray-300 font-semibold">{name}</p>
      <p className="text-white font-bold">{fmt(value)}</p>
      <p className="text-gray-400">{(percent * 100).toFixed(1)}% of total</p>
    </div>
  )
}

function CustomLegend({ payload }: any) {
  return (
    <div className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 mt-2">
      {payload.map((entry: any) => (
        <div key={entry.value} className="flex items-center gap-1.5 text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: entry.color }} />
          <span className="truncate max-w-[100px]">{entry.value}</span>
        </div>
      ))}
    </div>
  )
}


export default function SavingsAccountPie({ accounts, accountTotals }: Props) {
  const data = accounts
    .filter(a => a.isActive)
    .map(a => {
      const t = accountTotals[a.id] ?? { deposited: 0, interest: 0, withdrawn: 0 }
      return { name: a.name, value: Math.max(0, t.deposited + t.interest - t.withdrawn) }
    })
    .filter(d => d.value > 0)

  const total = data.reduce((s, d) => s + d.value, 0)

  if (data.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-500">
      <p className="text-sm">No savings data yet</p>
      <p className="text-xs">Add a deposit to see the breakdown</p>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 relative">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="transparent" />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend content={<CustomLegend />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Centre label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ top: '-8px' }}>
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-base font-bold text-white">{fmt(total)}</p>
        </div>
      </div>
    </div>
  )
}

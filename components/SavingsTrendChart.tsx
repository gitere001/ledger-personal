'use client'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

interface TrendPoint {
  month: string
  label: string
  deposited: number
  interest: number
  withdrawn: number
  balance: number
}

interface Props {
  data: TrendPoint[]
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const d = payload[0]?.payload as TrendPoint
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-3 shadow-xl text-xs space-y-1.5 min-w-[180px]">
      <p className="text-gray-300 font-semibold text-sm mb-2">{label}</p>
      {d.deposited > 0 && (
        <div className="flex justify-between gap-4">
          <span className="text-blue-400">Deposited</span>
          <span className="text-white font-medium">{fmt(d.deposited)}</span>
        </div>
      )}
      {d.interest > 0 && (
        <div className="flex justify-between gap-4">
          <span className="text-green-400">Interest</span>
          <span className="text-white font-medium">{fmt(d.interest)}</span>
        </div>
      )}
      {d.withdrawn > 0 && (
        <div className="flex justify-between gap-4">
          <span className="text-red-400">Withdrawn</span>
          <span className="text-white font-medium">{fmt(d.withdrawn)}</span>
        </div>
      )}
      <div className="flex justify-between gap-4 border-t border-gray-700 pt-1.5 mt-1">
        <span className="text-yellow-400 font-semibold">Balance</span>
        <span className="text-yellow-400 font-bold">{fmt(d.balance)}</span>
      </div>
    </div>
  )
}

export default function SavingsTrendChart({ data }: Props) {
  if (!data.length) return (
    <div className="flex items-center justify-center h-48 text-gray-500 text-sm">No savings data yet</div>
  )

  return (
    <ResponsiveContainer width="100%" height={280}>
      <ComposedChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
        <XAxis
          dataKey="label"
          tick={{ fill: '#6b7280', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          yAxisId="bars"
          tick={{ fill: '#6b7280', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
          width={40}
        />
        <YAxis
          yAxisId="balance"
          orientation="right"
          tick={{ fill: '#fbbf24', fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v)}
          width={44}
        />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
        <Legend
          wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
          formatter={(value) => <span style={{ color: '#9ca3af' }}>{value}</span>}
        />
        <Bar yAxisId="bars" dataKey="deposited" name="Deposited"  fill="#3b82f6" radius={[3, 3, 0, 0]} maxBarSize={36} />
        <Bar yAxisId="bars" dataKey="interest"  name="Interest"   fill="#22c55e" radius={[3, 3, 0, 0]} maxBarSize={36} />
        <Bar yAxisId="bars" dataKey="withdrawn" name="Withdrawn"  fill="#ef4444" radius={[3, 3, 0, 0]} maxBarSize={36} />
        <Line
          yAxisId="balance"
          type="monotone"
          dataKey="balance"
          name="Balance"
          stroke="#fbbf24"
          strokeWidth={2.5}
          dot={{ fill: '#fbbf24', r: 4, strokeWidth: 0 }}
          activeDot={{ r: 6, fill: '#fbbf24' }}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

'use client'

interface LmtdData {
  income: number
  expenses: number
  savings: number
  cashBalance: number
  dateRange: string
}

interface Props {
  income: number
  expenses: number
  savings: number
  cashBalance: number
  lmtd?: LmtdData
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)

export default function SummaryCards({ income, expenses, savings, cashBalance, lmtd }: Props) {
  const cards = [
    { label: 'Income',       value: income,       lmtdValue: lmtd?.income,       color: 'text-green-400',  bg: 'border-green-800'  },
    { label: 'Expenses',     value: expenses,     lmtdValue: lmtd?.expenses,     color: 'text-red-400',    bg: 'border-red-800'    },
    { label: 'Saved',        value: savings,      lmtdValue: lmtd?.savings,      color: 'text-blue-400',   bg: 'border-blue-800'   },
    { label: 'Cash Balance', value: cashBalance,  lmtdValue: lmtd?.cashBalance,  color: 'text-yellow-400', bg: 'border-yellow-800' },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(c => (
        <div key={c.label} className={`bg-gray-900 border ${c.bg} rounded-xl p-4`}>
          <p className="text-gray-400 text-xs mb-1">{c.label}</p>
          <p className={`text-xl font-bold ${c.color}`}>{fmt(c.value)}</p>
          {lmtd && c.lmtdValue !== undefined && (
            <p className="text-[11px] text-gray-600 mt-1.5">
              LMTD ({lmtd.dateRange})&nbsp;<span className="text-gray-500">{fmt(c.lmtdValue)}</span>
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

'use client'

interface BudgetRow {
  categoryId: number
  name: string
  budgeted: number
  actual: number
  remaining: number
  status: 'green' | 'yellow' | 'red' | 'unset'
}

interface Props {
  rows: BudgetRow[]
  transactionFees: BudgetRow
  paceRatio: number
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)

function AlertRow({ row, paceRatio }: { row: BudgetRow; paceRatio: number }) {
  const pct = row.budgeted > 0 ? Math.min((row.actual / row.budgeted) * 100, 100) : 0
  const isOver = row.actual > row.budgeted
  const barColor = isOver ? 'bg-red-500' : 'bg-yellow-500'

  return (
    <div className="space-y-1.5 py-3 border-b border-gray-800/60 last:border-0">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-300 font-medium truncate pr-2">{row.name}</span>
        <span className={isOver ? 'text-red-400 font-semibold' : 'text-yellow-400'}>
          {isOver
            ? `Over by ${fmt(Math.abs(row.remaining))}`
            : `${fmt(row.remaining)} left`}
        </span>
      </div>
      <div className="relative h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`absolute left-0 top-0 h-full rounded-full transition-all ${barColor}`}
          style={{ width: `${pct}%` }}
        />
        {/* pace marker */}
        <div
          className="absolute top-0 h-full w-px bg-gray-500"
          style={{ left: `${Math.min(paceRatio * 100, 100)}%` }}
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-gray-500">
        <span>{fmt(row.actual)} spent</span>
        <span>of {fmt(row.budgeted)}</span>
      </div>
    </div>
  )
}

export default function BudgetAlerts({ rows, transactionFees, paceRatio }: Props) {
  const all = [...rows, transactionFees].filter(r => r.budgeted > 0)

  const overBudget = all
    .filter(r => r.status === 'red')
    .sort((a, b) => (b.actual - b.budgeted) - (a.actual - a.budgeted))
    .slice(0, 6)

  const watchIt = all
    .filter(r => r.status === 'yellow')
    .sort((a, b) => (b.actual / b.budgeted) - (a.actual / a.budgeted))
    .slice(0, 6)

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      {/* Over budget */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-red-500 shrink-0" />
          <h2 className="text-sm font-medium text-gray-300">Over Budget</h2>
          <span className="ml-auto text-xs text-red-400 font-semibold">{overBudget.length} categories</span>
        </div>
        <div className="px-5">
          {overBudget.length === 0 ? (
            <p className="py-8 text-center text-gray-500 text-sm">All categories within budget</p>
          ) : (
            overBudget.map(row => (
              <AlertRow key={row.categoryId} row={row} paceRatio={paceRatio} />
            ))
          )}
        </div>
      </div>

      {/* Watch it */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-800 flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-yellow-400 shrink-0" />
          <h2 className="text-sm font-medium text-gray-300">Watch It</h2>
          <span className="ml-auto text-xs text-yellow-400 font-semibold">{watchIt.length} categories</span>
        </div>
        <div className="px-5">
          {watchIt.length === 0 ? (
            <p className="py-8 text-center text-gray-500 text-sm">No categories approaching limit</p>
          ) : (
            watchIt.map(row => (
              <AlertRow key={row.categoryId} row={row} paceRatio={paceRatio} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

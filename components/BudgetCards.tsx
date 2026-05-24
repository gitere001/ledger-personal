'use client'
import { useState } from 'react'

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
  uncategorizedActual: number
  onBudgetSet: (categoryId: number, amount: number) => Promise<void>
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)


function EditableBudget({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [input, setInput]     = useState(String(value))

  if (editing) return (
    <input
      autoFocus
      type="number"
      value={input}
      onChange={e => setInput(e.target.value)}
      onBlur={() => { setEditing(false); onSave(parseFloat(input) || 0) }}
      onKeyDown={e => {
        if (e.key === 'Enter')  { setEditing(false); onSave(parseFloat(input) || 0) }
        if (e.key === 'Escape') setEditing(false)
      }}
      className="w-full bg-gray-800 border border-blue-500 rounded px-1.5 py-0.5 text-white text-[11px] focus:outline-none"
      onClick={e => e.stopPropagation()}
    />
  )
  return (
    <button
      onClick={() => { setEditing(true); setInput(String(value)) }}
      className="text-[11px] text-gray-500 hover:text-gray-300 underline decoration-dotted transition-colors leading-none"
    >
      of {fmt(value)}
    </button>
  )
}

function BudgetCard({ row, onBudgetSet }: { row: BudgetRow; onBudgetSet: (id: number, v: number) => Promise<void> }) {
  const pct      = row.budgeted > 0 ? Math.min((row.actual / row.budgeted) * 100, 100) : row.actual > 0 ? 100 : 0
  const remRound = Math.round(row.remaining)

  // Visual colour driven by remaining, not by pace status — red only when genuinely over budget
  const visual = remRound < 0 ? 'red' : remRound === 0 ? 'zero' : row.status

  const stripe:     Record<string, string> = { green: 'bg-green-500', yellow: 'bg-yellow-400', red: 'bg-red-500',         zero: 'bg-gray-600', unset: 'bg-gray-600' }
  const glow:       Record<string, string> = { green: 'hover:border-green-800', yellow: 'hover:border-yellow-800', red: 'hover:border-red-800', zero: 'hover:border-gray-700', unset: 'hover:border-gray-700' }
  const spendColor: Record<string, string> = { green: 'text-white',  yellow: 'text-yellow-300', red: 'text-red-400', zero: 'text-gray-300', unset: 'text-gray-300' }
  const remColor:   Record<string, string> = { green: 'text-green-400', yellow: 'text-green-400', red: 'text-red-400', zero: 'text-gray-500', unset: 'text-gray-500' }

  return (
    <div className={`bg-gray-900 border border-gray-800 rounded-xl p-3.5 flex flex-col gap-2 transition-colors ${glow[visual]}`}>
      {/* Status stripe */}
      <div className={`h-0.5 rounded-full ${stripe[visual]} opacity-70`} />

      {/* Category */}
      <p className="text-[11px] font-semibold text-gray-400 truncate uppercase tracking-wide leading-tight" title={row.name}>
        {row.name}
      </p>

      {/* Actual spend */}
      <div className="flex-1">
        <p className={`text-sm font-bold leading-none mb-0.5 ${spendColor[visual]}`}>
          {fmt(row.actual)}
        </p>
        <EditableBudget value={row.budgeted} onSave={v => onBudgetSet(row.categoryId, v)} />
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${stripe[visual]}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Remaining */}
      <p className={`text-[11px] font-semibold tabular-nums ${remColor[visual]}`}>
        {remRound > 0 ? '+' : ''}{fmt(row.remaining)}
      </p>
    </div>
  )
}

export default function BudgetCards({ rows, transactionFees, uncategorizedActual, onBudgetSet }: Props) {
  const sorted = [...rows, transactionFees].sort((a, b) => b.actual - a.actual)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
      {sorted.map(row => (
        <BudgetCard key={row.categoryId} row={row} onBudgetSet={onBudgetSet} />
      ))}

      {uncategorizedActual > 0 && (
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-3.5 flex flex-col gap-2 opacity-50">
          <div className="h-0.5 rounded-full bg-gray-600" />
          <p className="text-[11px] font-semibold text-gray-500 truncate uppercase tracking-wide">Uncategorized</p>
          <div className="flex-1">
            <p className="text-sm font-bold text-gray-400 leading-none mb-0.5">{fmt(uncategorizedActual)}</p>
            <span className="text-[11px] text-gray-600">no budget set</span>
          </div>
          <div className="h-1.5 bg-gray-800 rounded-full" />
          <p className="text-[11px] text-gray-600">—</p>
        </div>
      )}
    </div>
  )
}

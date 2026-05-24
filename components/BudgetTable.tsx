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
  paceRatio: number
  currentDay: number
  daysInMonth: number
  onBudgetSet: (categoryId: number, amount: number) => Promise<void>
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)

const statusDot: Record<string, string> = {
  green: 'bg-green-500',
  yellow: 'bg-yellow-400',
  red: 'bg-red-500',
  unset: 'bg-gray-600',
}

const statusLabel: Record<string, string> = {
  green: 'On track',
  yellow: 'Watch it',
  red: 'Over pace',
  unset: 'Not set',
}

function EditableCell({ value, onSave }: { value: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [input, setInput] = useState(String(value))

  if (editing) {
    return (
      <input
        autoFocus
        type="number"
        value={input}
        onChange={e => setInput(e.target.value)}
        onBlur={() => { setEditing(false); onSave(parseFloat(input) || 0) }}
        onKeyDown={e => { if (e.key === 'Enter') { setEditing(false); onSave(parseFloat(input) || 0) } }}
        className="w-24 bg-gray-700 border border-blue-500 rounded px-2 py-0.5 text-white text-sm focus:outline-none"
      />
    )
  }
  return (
    <button onClick={() => setEditing(true)} className="text-gray-300 hover:text-white text-sm text-left underline decoration-dotted">
      {fmt(value)}
    </button>
  )
}

export default function BudgetTable({ rows, transactionFees, uncategorizedActual, paceRatio, currentDay, daysInMonth, onBudgetSet }: Props) {
  const allRows = [...rows].sort((a, b) => b.actual - a.actual).concat(transactionFees)
  const totalBudgeted = allRows.reduce((s, r) => s + r.budgeted, 0)
  const totalActual = allRows.reduce((s, r) => s + r.actual, 0) + uncategorizedActual

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <h2 className="text-sm font-medium text-gray-300">Budget vs Actual</h2>
        <span className="text-xs text-gray-500">Day {currentDay} of {daysInMonth} · {Math.round(paceRatio * 100)}% through month</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="text-left px-4 py-2 text-gray-500 font-medium">Category</th>
              <th className="text-right px-4 py-2 text-gray-500 font-medium">Budgeted</th>
              <th className="text-right px-4 py-2 text-gray-500 font-medium">Actual</th>
              <th className="text-right px-4 py-2 text-gray-500 font-medium">Remaining</th>
              <th className="text-center px-4 py-2 text-gray-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {allRows.map(row => (
              <tr key={row.categoryId} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                <td className="px-4 py-2.5 text-gray-300">{row.name}</td>
                <td className="px-4 py-2.5 text-right">
                  <EditableCell value={row.budgeted} onSave={v => onBudgetSet(row.categoryId, v)} />
                </td>
                <td className="px-4 py-2.5 text-right text-gray-300">{fmt(row.actual)}</td>
                <td className={`px-4 py-2.5 text-right font-medium ${Math.round(row.remaining) > 0 ? 'text-green-400' : Math.round(row.remaining) < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                  {Math.round(row.remaining) > 0 ? '+' : ''}{fmt(row.remaining)}
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-center gap-1.5">
                    <span className={`w-2 h-2 rounded-full ${statusDot[row.status]}`} />
                    <span className="text-xs text-gray-500">{statusLabel[row.status]}</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-gray-700 bg-gray-800/30">
              <td className="px-4 py-3 text-gray-200 font-semibold">Total</td>
              <td className="px-4 py-3 text-right text-gray-200 font-semibold">{fmt(totalBudgeted)}</td>
              <td className="px-4 py-3 text-right text-gray-200 font-semibold">{fmt(totalActual)}</td>
              {(() => {
                const r = Math.round(totalBudgeted - totalActual)
                return (
                  <td className={`px-4 py-3 text-right font-semibold ${r > 0 ? 'text-green-400' : r < 0 ? 'text-red-400' : 'text-gray-500'}`}>
                    {r > 0 ? '+' : ''}{fmt(totalBudgeted - totalActual)}
                  </td>
                )
              })()}
              <td />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}

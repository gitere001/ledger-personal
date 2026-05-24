'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import BudgetTable from '@/components/BudgetTable'
import BudgetCards from '@/components/BudgetCards'
import { TrendingDown, TrendingUp, Target, Gauge, LayoutGrid, List } from 'lucide-react'

const currentMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const monthLabel = (m: string) => {
  const [y, mo] = m.split('-').map(Number)
  return new Date(y, mo - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 0 }).format(n)

type ViewMode = 'cards' | 'table'

export default function BudgetPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [budget, setBudget]           = useState<any>(null)
  const [selectedMonth, setSelectedMonth] = useState(currentMonth())
  const [loading, setLoading]         = useState(true)
  const [view, setView]               = useState<ViewMode>('cards')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const fetchBudget = useCallback(async () => {
    setLoading(true)
    const res = await fetch(`/api/budget?month=${selectedMonth}`)
    setBudget(await res.json())
    setLoading(false)
  }, [selectedMonth])

  useEffect(() => { fetchBudget() }, [fetchBudget])

  const handleBudgetSet = async (categoryId: number, budgeted: number) => {
    await fetch('/api/budget', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ month: selectedMonth, categoryId, budgeted }),
    })
    fetchBudget()
  }

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { value: val, label: monthLabel(val) }
  })

  if (status === 'loading' || !session) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const totalBudgeted = budget
    ? [...budget.rows, budget.transactionFees].reduce((s: number, r: any) => s + r.budgeted, 0)
    : 0
  const totalActual = budget
    ? [...budget.rows, budget.transactionFees].reduce((s: number, r: any) => s + r.actual, 0) + (budget.uncategorizedActual ?? 0)
    : 0
  const remaining   = totalBudgeted - totalActual
  const paceUsed    = budget ? Math.round(budget.paceRatio * 100) : 0
  const budgetUsed  = totalBudgeted > 0 ? Math.round((totalActual / totalBudgeted) * 100) : 0
  const paceStatus  = budgetUsed > paceUsed + 10 ? 'red' : budgetUsed > paceUsed ? 'yellow' : 'green'

  const statCards = [
    { label: 'Total Budgeted', value: fmt(totalBudgeted), icon: Target,      color: 'text-blue-400',                                           bg: 'bg-blue-500/10'   },
    { label: 'Total Spent',    value: fmt(totalActual),   icon: TrendingDown, color: 'text-orange-400',                                         bg: 'bg-orange-500/10' },
    { label: 'Remaining',      value: fmt(remaining),     icon: TrendingUp,   color: remaining > 0 ? 'text-green-400' : remaining < 0 ? 'text-red-400' : 'text-gray-400', bg: remaining > 0 ? 'bg-green-500/10' : remaining < 0 ? 'bg-red-500/10' : 'bg-gray-700' },
    {
      label: 'Pace vs Spend',
      value: `${paceUsed}% time · ${budgetUsed}% spent`,
      icon: Gauge,
      color: paceStatus === 'red' ? 'text-red-400' : paceStatus === 'yellow' ? 'text-yellow-400' : 'text-green-400',
      bg:    paceStatus === 'red' ? 'bg-red-500/10' : paceStatus === 'yellow' ? 'bg-yellow-500/10' : 'bg-green-500/10',
    },
  ]

  return (
    <div className="text-white">
      {/* Page header */}
      <div className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Budget</h1>
          <p className="text-xs text-gray-500 mt-0.5">{monthLabel(selectedMonth)}</p>
        </div>
        <div className="flex items-center gap-3">
          {/* View toggle */}
          <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg p-0.5">
            <button
              onClick={() => setView('cards')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === 'cards' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <LayoutGrid size={13} />
              Cards
            </button>
            <button
              onClick={() => setView('table')}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === 'table' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              <List size={13} />
              Table
            </button>
          </div>

          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
          >
            {monthOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6 max-w-7xl">
        {/* Stat cards */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {statCards.map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="bg-gray-900 border border-gray-800 rounded-xl p-4 flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
                <Icon size={16} className={color} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`text-sm font-semibold mt-0.5 ${color} truncate`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Budget content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : budget && (
          view === 'cards' ? (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-sm font-medium text-gray-300">Budget vs Actual</h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Day {budget.currentDay} of {budget.daysInMonth} · {Math.round(budget.paceRatio * 100)}% through month · sorted by spend
                  </p>
                </div>
              </div>
              <BudgetCards
                rows={budget.rows}
                transactionFees={budget.transactionFees}
                uncategorizedActual={budget.uncategorizedActual ?? 0}
                onBudgetSet={handleBudgetSet}
              />
            </div>
          ) : (
            <BudgetTable
              rows={budget.rows}
              transactionFees={budget.transactionFees}
              uncategorizedActual={budget.uncategorizedActual ?? 0}
              paceRatio={budget.paceRatio}
              currentDay={budget.currentDay}
              daysInMonth={budget.daysInMonth}
              onBudgetSet={handleBudgetSet}
            />
          )
        )}
      </div>
    </div>
  )
}

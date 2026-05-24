'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import SummaryCards from '@/components/SummaryCards'
import FinanceChart from '@/components/FinanceChart'
import SavingsTrendChart from '@/components/SavingsTrendChart'
import SavingsAccountPie from '@/components/SavingsAccountPie'
import FinanceChartSkeleton from '@/components/skeletons/FinanceChartSkeleton'
import SavingsTrendChartSkeleton from '@/components/skeletons/SavingsTrendChartSkeleton'
import SavingsAccountPieSkeleton from '@/components/skeletons/SavingsAccountPieSkeleton'
import SavingsSnapshotSkeleton from '@/components/skeletons/SavingsSnapshotSkeleton'
import RecentActivitySkeleton from '@/components/skeletons/RecentActivitySkeleton'
import BudgetAlerts from '@/components/BudgetAlerts'
import RecordSavingsModal from '@/components/modals/RecordSavingsModal'

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

export default function Dashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [overview, setOverview]       = useState<{ months: any[]; cashBalance: number } | null>(null)
  const [budget, setBudget]           = useState<any>(null)
  const [savingsData, setSavingsData] = useState<{ rows: any[]; stats: any; accountTotals: Record<number, any> } | null>(null)
  const [savingsTrend, setSavingsTrend] = useState<any[] | null>(null)
  const [accounts, setAccounts]       = useState<{ id: number; name: string; isActive: boolean }[]>([])
  const [selectedMonth, setSelectedMonth] = useState(currentMonth())
  const [chartMonths, setChartMonths] = useState(6)
  const [trendMonths, setTrendMonths] = useState(6)
  const [showSavingsModal, setShowSavingsModal] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const fetchOverview = useCallback(async () => {
    const res = await fetch(`/api/overview?months=${chartMonths}`)
    setOverview(await res.json())
  }, [chartMonths])

  const fetchBudget = useCallback(async () => {
    const res = await fetch(`/api/budget?month=${selectedMonth}`)
    setBudget(await res.json())
  }, [selectedMonth])

  const fetchSavings = useCallback(async () => {
    const res = await fetch('/api/savings?all=true')
    setSavingsData(await res.json())
  }, [])

  const fetchTrend = useCallback(async () => {
    const res = await fetch(`/api/savings/trend?months=${trendMonths}`)
    setSavingsTrend(await res.json())
  }, [trendMonths])

  const fetchAccounts = useCallback(async () => {
    const res = await fetch('/api/savings/accounts')
    setAccounts(await res.json())
  }, [])

  useEffect(() => { fetchOverview()  }, [fetchOverview])
  useEffect(() => { fetchBudget()    }, [fetchBudget])
  useEffect(() => { fetchSavings()   }, [fetchSavings])
  useEffect(() => { fetchTrend()     }, [fetchTrend])
  useEffect(() => { fetchAccounts()  }, [fetchAccounts])

  const handleDeleteSaving = async (id: number) => {
    await fetch(`/api/savings?id=${id}`, { method: 'DELETE' })
    fetchSavings(); fetchTrend()
  }

  if (status === 'loading' || !session) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const currentOverviewMonth = overview?.months.find(m => m.month === selectedMonth)
  const savingsStats = savingsData?.stats

  const monthOptions = Array.from({ length: 12 }, (_, i) => {
    const d = new Date()
    d.setMonth(d.getMonth() - i)
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return { value: val, label: monthLabel(val) }
  })

  return (
    <div className="text-white">
      {/* Page header */}
      <div className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Dashboard</h1>
          <p className="text-xs text-gray-500 mt-0.5">Overview of your finances</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={selectedMonth}
            onChange={e => setSelectedMonth(e.target.value)}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
          >
            {monthOptions.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button
            onClick={() => setShowSavingsModal(true)}
            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            + Save
          </button>
        </div>
      </div>

      <div className="px-6 py-6 space-y-6 max-w-7xl">

        {/* Row 1 — Stat cards */}
        <SummaryCards
          income={currentOverviewMonth?.income || 0}
          expenses={currentOverviewMonth?.expenses || 0}
          savings={savingsStats?.balance || 0}
          cashBalance={overview?.cashBalance || 0}
        />

        {/* Row 2 — Income/Expenses bar + Savings snapshot */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-medium text-gray-300">Income vs Expenses</h2>
              <div className="flex gap-1">
                {[3, 6, 12].map(n => (
                  <button key={n} onClick={() => setChartMonths(n)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${chartMonths === n ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                    {n}M
                  </button>
                ))}
              </div>
            </div>
            {overview ? <FinanceChart data={overview.months} /> : <FinanceChartSkeleton />}
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col gap-3">
            <h2 className="text-sm font-medium text-gray-300">Savings Snapshot</h2>
            {savingsStats ? (
              <>
                {[
                  { label: 'Deposited',  value: savingsStats.totalDeposited, color: 'text-blue-400'  },
                  { label: 'Interest',   value: savingsStats.totalInterest,  color: 'text-green-400' },
                  { label: 'Withdrawn',  value: savingsStats.totalWithdrawn, color: 'text-red-400'   },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center justify-between py-2 border-b border-gray-800">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className={`text-sm font-semibold ${color}`}>{fmt(value)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm text-gray-300 font-medium">Balance</span>
                  <span className="text-base font-bold text-white">{fmt(savingsStats.balance)}</span>
                </div>
                <button onClick={() => setShowSavingsModal(true)}
                  className="mt-auto w-full py-2 bg-blue-600/20 border border-blue-600/30 text-blue-400 text-sm rounded-lg hover:bg-blue-600/30 transition-colors">
                  + Record Transaction
                </button>
              </>
            ) : (
              <SavingsSnapshotSkeleton />
            )}
          </div>
        </div>

        {/* Row 3 — Savings trend (60%) + account pie (40%) */}
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
          <div className="xl:col-span-3 bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-medium text-gray-300">Savings Trend</h2>
                <p className="text-xs text-gray-500 mt-0.5">Monthly deposits, interest &amp; withdrawals — balance line in yellow</p>
              </div>
              <div className="flex gap-1">
                {[3, 6, 12].map(n => (
                  <button key={n} onClick={() => setTrendMonths(n)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${trendMonths === n ? 'bg-yellow-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                    {n}M
                  </button>
                ))}
              </div>
            </div>
            {savingsTrend === null
              ? <SavingsTrendChartSkeleton />
              : <SavingsTrendChart data={savingsTrend} />
            }
          </div>

          <div className="xl:col-span-2 bg-gray-900 border border-gray-800 rounded-xl p-5 flex flex-col">
            <h2 className="text-sm font-medium text-gray-300 mb-1">Balance by Account</h2>
            <p className="text-xs text-gray-500 mb-4">Current balance split across active accounts</p>
            <div className="flex-1 min-h-[260px]">
              {savingsData === null || accounts.length === 0
                ? <SavingsAccountPieSkeleton />
                : <SavingsAccountPie accounts={accounts} accountTotals={savingsData.accountTotals} />
              }
            </div>
          </div>
        </div>

        {/* Row 4 — Budget alerts */}
        {budget && (
          <BudgetAlerts
            rows={budget.rows}
            transactionFees={budget.transactionFees}
            paceRatio={budget.paceRatio}
          />
        )}

        {/* Row 5 — Recent savings activity */}
        {savingsData === null && <RecentActivitySkeleton />}
        {savingsData && savingsData.rows.length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
            <div className="px-5 py-3.5 border-b border-gray-800">
              <h2 className="text-sm font-medium text-gray-300">Recent Savings Activity</h2>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-5 py-2.5 text-gray-500 font-medium">Date</th>
                  <th className="text-left px-5 py-2.5 text-gray-500 font-medium">Type</th>
                  <th className="text-left px-5 py-2.5 text-gray-500 font-medium">Note</th>
                  <th className="text-right px-5 py-2.5 text-gray-500 font-medium">Amount</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {savingsData.rows.slice(0, 5).map((s: any) => (
                  <tr key={s.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                    <td className="px-5 py-2.5 text-gray-400 text-xs">
                      {new Date(s.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-2.5">
                      <TypeBadge type={s.type} />
                    </td>
                    <td className="px-5 py-2.5 text-gray-300">{s.note || '—'}</td>
                    <td className={`px-5 py-2.5 text-right font-medium ${s.type === 'withdrawal' ? 'text-red-400' : s.type === 'interest' ? 'text-green-400' : 'text-blue-400'}`}>
                      {s.type === 'withdrawal' ? '-' : '+'}{fmt(s.amount)}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <button onClick={() => handleDeleteSaving(s.id)} className="text-gray-600 hover:text-red-400 text-xs transition-colors">remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <RecordSavingsModal
        isOpen={showSavingsModal}
        onClose={() => setShowSavingsModal(false)}
        onSaved={() => { fetchSavings(); fetchTrend(); fetchOverview(); fetchAccounts() }}
      />
    </div>
  )
}


function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; className: string }> = {
    deposit:    { label: 'Deposit',    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20'   },
    interest:   { label: 'Interest',   className: 'bg-green-500/10 text-green-400 border-green-500/20' },
    withdrawal: { label: 'Withdrawal', className: 'bg-red-500/10 text-red-400 border-red-500/20'       },
  }
  const { label, className } = map[type] ?? { label: type, className: 'bg-gray-700 text-gray-400 border-gray-600' }
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border ${className}`}>
      {label}
    </span>
  )
}

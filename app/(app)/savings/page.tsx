'use client'
import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import RecordSavingsModal from '@/components/modals/RecordSavingsModal'
import { PiggyBank, TrendingUp, ArrowDownLeft, Landmark, Plus, X } from 'lucide-react'

interface Account { id: number; name: string; isActive: boolean }

const fmt = (n: number) =>
  new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', maximumFractionDigits: 2 }).format(n)

function TypeBadge({ type }: { type: string }) {
  const map: Record<string, { label: string; className: string }> = {
    deposit:    { label: 'Deposit',    className: 'bg-blue-500/10 text-blue-400 border-blue-500/20'    },
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

export default function SavingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const [data, setData]         = useState<{ rows: any[]; stats: any; accountTotals: Record<number, any> } | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [showModal, setShowModal]   = useState(false)
  const [defaultType, setDefaultType] = useState<'deposit' | 'interest' | 'withdrawal'>('deposit')
  const [loading, setLoading]   = useState(true)

  // Add account inline state
  const [showAddAccount, setShowAddAccount] = useState(false)
  const [newAccountName, setNewAccountName] = useState('')
  const [addingAccount, setAddingAccount]   = useState(false)
  const [accountError, setAccountError]     = useState('')

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/login')
  }, [status, router])

  const fetchAccounts = useCallback(async () => {
    const res = await fetch('/api/savings/accounts')
    setAccounts(await res.json())
  }, [])

  const fetchSavings = useCallback(async () => {
    setLoading(true)
    const res = await fetch('/api/savings?all=true')
    setData(await res.json())
    setLoading(false)
  }, [])

  useEffect(() => { fetchAccounts() }, [fetchAccounts])
  useEffect(() => { fetchSavings()  }, [fetchSavings])

  const handleDelete = async (id: number) => {
    await fetch(`/api/savings?id=${id}`, { method: 'DELETE' })
    fetchSavings()
  }

  const openModal = (type: 'deposit' | 'interest' | 'withdrawal') => {
    setDefaultType(type)
    setShowModal(true)
  }

  const handleAddAccount = async () => {
    if (!newAccountName.trim()) { setAccountError('Enter a name'); return }
    setAddingAccount(true); setAccountError('')
    try {
      const res = await fetch('/api/savings/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAccountName.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Failed')
      }
      setNewAccountName('')
      setShowAddAccount(false)
      fetchAccounts()
    } catch (e: any) {
      setAccountError(e.message)
    } finally {
      setAddingAccount(false)
    }
  }

  const handleArchiveAccount = async (id: number) => {
    await fetch(`/api/savings/accounts?id=${id}`, { method: 'DELETE' })
    fetchAccounts()
  }

  const handleRestoreAccount = async (id: number) => {
    await fetch(`/api/savings/accounts?id=${id}`, { method: 'PATCH' })
    fetchAccounts()
  }

  if (status === 'loading' || !session) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const stats = data?.stats
  const accountTotals = data?.accountTotals ?? {}

  const statCards = stats ? [
    { label: 'Total Deposited', value: fmt(stats.totalDeposited), icon: PiggyBank,     color: 'text-blue-400',  bg: 'bg-blue-500/10'  },
    { label: 'Interest Earned', value: fmt(stats.totalInterest),  icon: TrendingUp,    color: 'text-green-400', bg: 'bg-green-500/10' },
    { label: 'Total Balance',   value: fmt(stats.balance),        icon: Landmark,      color: 'text-white',     bg: 'bg-gray-700'     },
    { label: 'Total Withdrawn', value: fmt(stats.totalWithdrawn), icon: ArrowDownLeft, color: 'text-red-400',   bg: 'bg-red-500/10'   },
  ] : []

  return (
    <div className="text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-white">Savings</h1>
          <p className="text-xs text-gray-500 mt-0.5">All-time savings activity</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => openModal('deposit')}    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium">+ Deposit</button>
          <button onClick={() => openModal('interest')}   className="px-3 py-1.5 bg-green-700 text-white text-sm rounded-lg hover:bg-green-800 transition-colors font-medium">+ Interest</button>
          <button onClick={() => openModal('withdrawal')} className="px-3 py-1.5 bg-red-700 text-white text-sm rounded-lg hover:bg-red-800 transition-colors font-medium">+ Withdraw</button>
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
              <div>
                <p className="text-xs text-gray-500">{label}</p>
                <p className={`text-sm font-semibold mt-0.5 ${color}`}>{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Accounts */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-sm font-medium text-gray-300">Savings Accounts</h2>
            <button
              onClick={() => { setShowAddAccount(v => !v); setAccountError('') }}
              className="flex items-center gap-1.5 text-xs text-blue-400 hover:text-blue-300 transition-colors"
            >
              <Plus size={13} />
              Add Account
            </button>
          </div>

          {/* Inline add account */}
          {showAddAccount && (
            <div className="px-5 py-3 border-b border-gray-800 bg-gray-800/40 flex items-center gap-2">
              <input
                autoFocus
                type="text"
                value={newAccountName}
                onChange={e => setNewAccountName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') handleAddAccount(); if (e.key === 'Escape') setShowAddAccount(false) }}
                placeholder="e.g. KCB Goal Savings"
                className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-blue-500"
              />
              {accountError && <span className="text-red-400 text-xs">{accountError}</span>}
              <button onClick={handleAddAccount} disabled={addingAccount}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {addingAccount ? '…' : 'Save'}
              </button>
              <button onClick={() => setShowAddAccount(false)} className="text-gray-500 hover:text-white">
                <X size={15} />
              </button>
            </div>
          )}

          <div className="divide-y divide-gray-800/60">
            {accounts.filter(a => a.isActive).length === 0 && (
              <p className="px-5 py-6 text-center text-gray-500 text-sm">No active accounts</p>
            )}
            {/* Active accounts */}
            {accounts.filter(a => a.isActive).map(account => {
              const t = accountTotals[account.id] ?? { deposited: 0, interest: 0, withdrawn: 0 }
              const balance = t.deposited + t.interest - t.withdrawn
              return (
                <div key={account.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-gray-800/20 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Landmark size={14} className="text-blue-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">{account.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {fmt(t.deposited)} deposited · {fmt(t.interest)} interest · {fmt(t.withdrawn)} withdrawn
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-bold text-white">{fmt(balance)}</p>
                    <button onClick={() => handleArchiveAccount(account.id)}
                      className="text-gray-600 hover:text-yellow-400 transition-colors text-xs">
                      archive
                    </button>
                  </div>
                </div>
              )
            })}
            {/* Archived accounts */}
            {accounts.filter(a => !a.isActive).map(account => {
              const t = accountTotals[account.id] ?? { deposited: 0, interest: 0, withdrawn: 0 }
              const balance = t.deposited + t.interest - t.withdrawn
              return (
                <div key={account.id} className="px-5 py-3.5 flex items-center justify-between opacity-50 hover:opacity-70 transition-opacity">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gray-700 flex items-center justify-center">
                      <Landmark size={14} className="text-gray-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-400">{account.name}</p>
                        <span className="text-[10px] text-gray-600 border border-gray-700 rounded px-1">archived</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-0.5">
                        {fmt(t.deposited)} deposited · {fmt(t.interest)} interest · {fmt(t.withdrawn)} withdrawn
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <p className="text-sm font-semibold text-gray-400">{fmt(balance)}</p>
                    <button onClick={() => handleRestoreAccount(account.id)}
                      className="text-gray-600 hover:text-blue-400 transition-colors text-xs">
                      restore
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Transaction log */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-800">
            <h2 className="text-sm font-medium text-gray-300">Transaction History</h2>
          </div>
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !data || data.rows.length === 0 ? (
            <p className="py-16 text-center text-gray-500 text-sm">No transactions yet</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left px-5 py-2.5 text-gray-500 font-medium">Date</th>
                  <th className="text-left px-5 py-2.5 text-gray-500 font-medium">Account</th>
                  <th className="text-left px-5 py-2.5 text-gray-500 font-medium">Type</th>
                  <th className="text-left px-5 py-2.5 text-gray-500 font-medium">Note</th>
                  <th className="text-right px-5 py-2.5 text-gray-500 font-medium">Amount</th>
                  <th className="px-5 py-2.5" />
                </tr>
              </thead>
              <tbody>
                {data.rows.map((row: any) => (
                  <tr key={row.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors">
                    <td className="px-5 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {new Date(row.date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3 text-gray-300 text-xs">{row.account?.name ?? <span className="text-gray-600">—</span>}</td>
                    <td className="px-5 py-3"><TypeBadge type={row.type} /></td>
                    <td className="px-5 py-3 text-gray-400 text-xs">{row.note || '—'}</td>
                    <td className={`px-5 py-3 text-right font-semibold ${row.type === 'withdrawal' ? 'text-red-400' : row.type === 'interest' ? 'text-green-400' : 'text-blue-400'}`}>
                      {row.type === 'withdrawal' ? '-' : '+'}{fmt(row.amount)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button onClick={() => handleDelete(row.id)} className="text-gray-600 hover:text-red-400 text-xs transition-colors">remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <RecordSavingsModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSaved={() => { fetchSavings(); fetchAccounts() }}
        defaultType={defaultType}
      />
    </div>
  )
}

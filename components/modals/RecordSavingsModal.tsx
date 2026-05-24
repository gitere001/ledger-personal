'use client'
import { useState, useEffect } from 'react'
import { X } from 'lucide-react'

interface Account { id: number; name: string; isActive: boolean }

interface Props {
  isOpen: boolean
  onClose: () => void
  onSaved: () => void
  defaultType?: 'deposit' | 'interest' | 'withdrawal'
}

const typeConfig = {
  deposit:    { label: 'Deposit',    notePlaceholder: 'Optional note',       color: 'bg-blue-600 hover:bg-blue-700'  },
  interest:   { label: 'Interest',   notePlaceholder: 'e.g. Monthly interest', color: 'bg-green-600 hover:bg-green-700' },
  withdrawal: { label: 'Withdrawal', notePlaceholder: 'e.g. Emergency',       color: 'bg-red-600 hover:bg-red-700'    },
}

export default function RecordSavingsModal({ isOpen, onClose, onSaved, defaultType = 'deposit' }: Props) {
  const [type, setType]       = useState<'deposit' | 'interest' | 'withdrawal'>(defaultType)
  const [amount, setAmount]   = useState('')
  const [date, setDate]       = useState(new Date().toISOString().slice(0, 10))
  const [note, setNote]       = useState('')
  const [accountId, setAccountId] = useState<string>('')
  const [accounts, setAccounts]   = useState<Account[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  useEffect(() => {
    if (isOpen) {
      fetch('/api/savings/accounts')
        .then(r => r.json())
        .then(setAccounts)
        .catch(() => {})
    }
  }, [isOpen])

  useEffect(() => { setType(defaultType) }, [defaultType])

  if (!isOpen) return null

  const cfg = typeConfig[type]

  const handleClose = () => {
    setAmount(''); setNote(''); setAccountId(''); setError('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountId) { setError('Please select an account'); return }
    setLoading(true); setError('')
    try {
      const res = await fetch('/api/savings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount, date, type, note, accountId }),
      })
      if (!res.ok) throw new Error('Failed')
      onSaved()
      handleClose()
    } catch {
      setError('Failed to record transaction')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-sm shadow-2xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
          <h3 className="text-white font-semibold">Record Savings Transaction</h3>
          <button onClick={handleClose} className="text-gray-500 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Type toggle */}
          <div className="grid grid-cols-3 gap-1.5 bg-gray-800 rounded-lg p-1">
            {(Object.keys(typeConfig) as Array<keyof typeof typeConfig>).map(t => (
              <button key={t} type="button" onClick={() => setType(t)}
                className={`py-1.5 rounded-md text-xs font-medium transition-colors ${type === t ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-gray-200'}`}>
                {typeConfig[t].label}
              </button>
            ))}
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Account */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">Account <span className="text-red-400">*</span></label>
              <select
                value={accountId}
                onChange={e => setAccountId(e.target.value)}
                required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              >
                <option value="">Select account…</option>
                {accounts.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Amount */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">Amount (KES)</label>
              <input type="number" value={amount} onChange={e => setAmount(e.target.value)}
                required min="0.01" step="0.01" placeholder="0.00"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>

            {/* Date */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">Date</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)} required
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>

            {/* Note */}
            <div>
              <label className="text-xs text-gray-400 block mb-1">Note <span className="text-gray-600">(optional)</span></label>
              <input type="text" value={note} onChange={e => setNote(e.target.value)}
                placeholder={cfg.notePlaceholder}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500" />
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={handleClose}
                className="flex-1 py-2 border border-gray-700 text-gray-300 rounded-lg text-sm hover:bg-gray-800 transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className={`flex-1 py-2 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${cfg.color}`}>
                {loading ? 'Saving…' : `Record ${cfg.label}`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

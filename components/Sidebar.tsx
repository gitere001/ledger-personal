'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import {
  LayoutDashboard, Wallet, PiggyBank,
  ChevronLeft, ChevronRight, LogOut, TrendingUp, X,
} from 'lucide-react'

interface Props {
  mobileOpen: boolean
  onMobileClose: () => void
}

const navItems = [
  { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/budget',    icon: Wallet,           label: 'Budget'    },
  { href: '/savings',   icon: PiggyBank,        label: 'Savings'   },
]

export default function Sidebar({ mobileOpen, onMobileClose }: Props) {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('sidebar-collapsed')
    if (stored !== null) setCollapsed(stored === 'true')
  }, [])

  const toggle = () => {
    setCollapsed(prev => {
      localStorage.setItem('sidebar-collapsed', String(!prev))
      return !prev
    })
  }

  return (
    <aside
      className={[
        'fixed inset-y-0 left-0 z-40 w-[220px]',
        'flex flex-col h-screen bg-gray-900 border-r border-gray-800',
        'transition-all duration-300 ease-in-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        'lg:relative lg:inset-auto lg:z-auto lg:translate-x-0 lg:shrink-0',
        collapsed ? 'lg:w-[60px]' : 'lg:w-[220px]',
      ].join(' ')}
    >
      {/* Brand header — expanded (mobile always + desktop when not collapsed) */}
      <div className={`flex items-center gap-2.5 px-4 py-5 border-b border-gray-800 ${collapsed ? 'lg:hidden' : ''}`}>
        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center shrink-0">
          <TrendingUp size={14} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white font-semibold text-sm leading-none">Ledger</p>
          <p className="text-gray-500 text-[11px] mt-0.5">Personal Finance</p>
        </div>
        {/* Mobile: X close */}
        <button
          onClick={onMobileClose}
          className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-gray-800 transition-colors"
          aria-label="Close menu"
        >
          <X size={18} />
        </button>
        {/* Desktop: collapse in */}
        <button
          onClick={toggle}
          className="hidden lg:flex p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-gray-800 transition-colors"
          aria-label="Collapse sidebar"
        >
          <ChevronLeft size={15} />
        </button>
      </div>

      {/* Brand header — collapsed (desktop only) */}
      {collapsed && (
        <button
          onClick={toggle}
          title="Expand sidebar"
          className="hidden lg:flex w-full flex-col items-center justify-center py-5 border-b border-gray-800 hover:bg-gray-800/50 transition-colors"
        >
          <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
            <TrendingUp size={14} className="text-white" />
          </div>
          <ChevronRight size={12} className="text-gray-600 mt-1.5" />
        </button>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-1 overflow-hidden">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname === href
          return (
            <Link
              key={href}
              href={href}
              onClick={onMobileClose}
              title={collapsed ? label : undefined}
              className={[
                'flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm font-medium',
                'transition-colors relative',
                active
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              ].join(' ')}
            >
              <Icon size={18} className="shrink-0" />
              <span className={`truncate ${collapsed ? 'lg:hidden' : ''}`}>{label}</span>
              {active && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-blue-500 rounded-r-full" />
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-gray-800">
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          title={collapsed ? 'Sign out' : undefined}
          className="w-full flex items-center gap-3 px-2.5 py-2.5 rounded-lg text-sm text-gray-400 hover:bg-gray-800 hover:text-red-400 transition-colors"
        >
          <LogOut size={18} className="shrink-0" />
          <span className={collapsed ? 'lg:hidden' : ''}>Sign out</span>
        </button>
      </div>
    </aside>
  )
}

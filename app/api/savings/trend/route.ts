import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const months = parseInt(searchParams.get('months') || '6')

  // Fetch all transactions ever to compute accurate running balance
  const all = await prisma.personalSaving.findMany({ orderBy: { date: 'asc' } })

  // Build a map of every month that has activity
  const activityByMonth: Record<string, { deposited: number; interest: number; withdrawn: number }> = {}

  for (const row of all) {
    const d = new Date(row.date)
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    if (!activityByMonth[key]) activityByMonth[key] = { deposited: 0, interest: 0, withdrawn: 0 }
    if (row.type === 'deposit')    activityByMonth[key].deposited  += row.amount
    if (row.type === 'interest')   activityByMonth[key].interest   += row.amount
    if (row.type === 'withdrawal') activityByMonth[key].withdrawn  += row.amount
  }

  // Build the last N months window (always show, even if no activity)
  const now = new Date()
  const windowMonths: string[] = []
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    windowMonths.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`)
  }

  // Compute running balance up to the start of our window
  const windowStart = windowMonths[0]
  let runningBalance = 0
  for (const [month, activity] of Object.entries(activityByMonth)) {
    if (month < windowStart) {
      runningBalance += activity.deposited + activity.interest - activity.withdrawn
    }
  }

  // Build result for each month in window
  const result = windowMonths.map(month => {
    const activity = activityByMonth[month] ?? { deposited: 0, interest: 0, withdrawn: 0 }
    runningBalance += activity.deposited + activity.interest - activity.withdrawn
    const [y, m] = month.split('-').map(Number)
    const label = new Date(y, m - 1).toLocaleString('default', { month: 'short' })
    return {
      month,
      label,
      deposited: activity.deposited,
      interest: activity.interest,
      withdrawn: activity.withdrawn,
      balance: runningBalance,
    }
  })

  return NextResponse.json(result)
}

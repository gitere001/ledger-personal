import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month   = searchParams.get('month')
  const all     = searchParams.get('all') === 'true'
  const stats   = searchParams.get('stats') === 'true'

  // --- stats=true: return only all-time stats + accountTotals, no rows ---
  if (stats) {
    const allRows = await prisma.personalSaving.findMany({})
    const totalDeposited = allRows.filter(r => r.type === 'deposit').reduce((s, r) => s + r.amount, 0)
    const totalInterest  = allRows.filter(r => r.type === 'interest').reduce((s, r) => s + r.amount, 0)
    const totalWithdrawn = allRows.filter(r => r.type === 'withdrawal').reduce((s, r) => s + r.amount, 0)
    const balance = totalDeposited + totalInterest - totalWithdrawn

    const accountTotals: Record<number, { deposited: number; interest: number; withdrawn: number }> = {}
    for (const r of allRows) {
      if (!r.accountId) continue
      if (!accountTotals[r.accountId]) accountTotals[r.accountId] = { deposited: 0, interest: 0, withdrawn: 0 }
      if (r.type === 'deposit')    accountTotals[r.accountId].deposited  += r.amount
      if (r.type === 'interest')   accountTotals[r.accountId].interest   += r.amount
      if (r.type === 'withdrawal') accountTotals[r.accountId].withdrawn  += r.amount
    }

    return NextResponse.json({ stats: { totalDeposited, totalInterest, totalWithdrawn, balance }, accountTotals })
  }

  // --- all=true: existing behaviour, dashboard uses this ---
  if (all) {
    const rows = await prisma.personalSaving.findMany({
      orderBy: { date: 'desc' },
      include: { account: { select: { id: true, name: true } } },
    })

    type Row = { type: string; amount: number; accountId: number | null }
    const allRows: Row[] = rows

    const totalDeposited = allRows.filter(r => r.type === 'deposit').reduce((s, r) => s + r.amount, 0)
    const totalInterest  = allRows.filter(r => r.type === 'interest').reduce((s, r) => s + r.amount, 0)
    const totalWithdrawn = allRows.filter(r => r.type === 'withdrawal').reduce((s, r) => s + r.amount, 0)
    const balance = totalDeposited + totalInterest - totalWithdrawn

    const accountTotals: Record<number, { deposited: number; interest: number; withdrawn: number }> = {}
    for (const r of allRows) {
      if (!r.accountId) continue
      if (!accountTotals[r.accountId]) accountTotals[r.accountId] = { deposited: 0, interest: 0, withdrawn: 0 }
      if (r.type === 'deposit')    accountTotals[r.accountId].deposited  += r.amount
      if (r.type === 'interest')   accountTotals[r.accountId].interest   += r.amount
      if (r.type === 'withdrawal') accountTotals[r.accountId].withdrawn  += r.amount
    }

    return NextResponse.json({ rows, stats: { totalDeposited, totalInterest, totalWithdrawn, balance }, accountTotals })
  }

  // --- paginated + filtered rows for savings page ---
  const limitParam = searchParams.get('limit')
  const type       = searchParams.get('type')      // deposit | interest | withdrawal | null
  const accountId  = searchParams.get('accountId') // number | null

  const limit = limitParam === 'all' ? undefined : parseInt(limitParam || '10')
  const skip  = 0 // no prev/next — just show N rows

  const where: any = {}
  if (type)      where.type      = type
  if (accountId) where.accountId = parseInt(accountId)
  if (month) {
    const [y, m] = month.split('-').map(Number)
    where.date = {
      gte: new Date(Date.UTC(y, m - 1, 1)),
      lte: new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)),
    }
  }

  const [rows, total] = await Promise.all([
    prisma.personalSaving.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { account: { select: { id: true, name: true } } },
      ...(limit ? { take: limit, skip } : {}),
    }),
    prisma.personalSaving.count({ where }),
  ])

  return NextResponse.json({ rows, total })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { date, amount, type, note, accountId } = await req.json()

  const validTypes = ['deposit', 'interest', 'withdrawal']
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  const saving = await prisma.personalSaving.create({
    data: {
      date: new Date(date),
      amount: parseFloat(amount),
      type,
      note: note || '',
      accountId: accountId ? parseInt(accountId) : null,
    },
    include: { account: { select: { id: true, name: true } } },
  })

  return NextResponse.json(saving)
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = parseInt(searchParams.get('id') || '0')

  await prisma.personalSaving.delete({ where: { id } })
  return NextResponse.json({ success: true })
}

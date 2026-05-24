import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const month = searchParams.get('month') // YYYY-MM

  if (!month) return NextResponse.json({ error: 'month required' }, { status: 400 })

  const [y, m] = month.split('-').map(Number)
  const start = new Date(Date.UTC(y, m - 1, 1)).toISOString()
  const end = new Date(Date.UTC(y, m, 0, 23, 59, 59, 999)).toISOString()

  const [categories, actuals, feeActual, budgets, defaults] = await Promise.all([
    prisma.$queryRaw<{ id: number; name: string }[]>`
      SELECT id, name FROM expense_categories WHERE "companyId" = 5 ORDER BY name
    `,
    prisma.$queryRaw<{ categoryId: number; total: string }[]>`
      SELECT e."categoryId", COALESCE(SUM(e."totalAmount"), 0) AS total
      FROM expenses e
      WHERE e."companyId" = 5 AND e."isReversal" = false
        AND e."expenseDate" >= ${start}::timestamptz AND e."expenseDate" <= ${end}::timestamptz
      GROUP BY e."categoryId"
    `,
    prisma.$queryRaw<{ total: string }[]>`
      SELECT COALESCE(SUM(ct."transactionFee"), 0) AS total
      FROM cash_transactions ct
      WHERE ct."companyId" = 5 AND ct."isReversal" = false
      AND (
        (
          ct."referenceType" = 'expense'
          AND ct."referenceId" IN (
            SELECT id FROM expenses
            WHERE "companyId" = 5 AND "isReversal" = false
              AND "expenseDate" >= ${start}::timestamptz AND "expenseDate" <= ${end}::timestamptz
          )
        )
        OR
        (
          ct."referenceType" NOT IN ('expense', 'sale', 'opening_balance', 'loan')
          AND ct."transactionFee" > 0
          AND ct."transactionDate" >= ${start}::timestamptz AND ct."transactionDate" <= ${end}::timestamptz
        )
      )
    `,
    prisma.personalBudget.findMany({ where: { month } }),
    prisma.$queryRaw<{ categoryId: number; amount: number }[]>`
      SELECT "categoryId", amount FROM personal_budget_defaults
    `,
  ])

  const actualsMap: Record<number, number> = {}
  for (const a of actuals) actualsMap[a.categoryId] = parseFloat(a.total)

  const budgetsMap: Record<number, number> = {}
  for (const b of budgets) budgetsMap[b.categoryId] = b.budgeted

  const defaultsMap: Record<number, number> = {}
  for (const d of defaults) defaultsMap[Number(d.categoryId)] = Number(d.amount)

  const now = new Date()
  const daysInMonth = new Date(Date.UTC(y, m, 0)).getUTCDate()
  const currentDay = (y === now.getUTCFullYear() && m === now.getUTCMonth() + 1)
    ? now.getUTCDate()
    : daysInMonth
  const paceRatio = currentDay / daysInMonth

  const knownCategoryIds = new Set<number>()
  const rows = categories.map((cat: { id: number; name: string }) => {
    const catId = Number(cat.id)
    knownCategoryIds.add(catId)
    const actual = actualsMap[catId] || 0
    const budgeted = catId in budgetsMap ? budgetsMap[catId] : (defaultsMap[catId] ?? 0)
    const spendRatio = budgeted > 0 ? actual / budgeted : null
    let status: 'green' | 'yellow' | 'red' | 'unset' = 'unset'
    if (budgeted > 0) {
      if (spendRatio! > 1) status = 'red'
      else if (spendRatio! > paceRatio + 0.1) status = 'red'
      else if (spendRatio! > paceRatio - 0.1) status = 'yellow'
      else status = 'green'
    }
    return { categoryId: cat.id, name: cat.name, budgeted, actual, remaining: budgeted - actual, status }
  })

  // Catch any expenses whose categoryId didn't match a known category
  const uncategorizedActual = Object.entries(actualsMap)
    .filter(([id]) => !knownCategoryIds.has(Number(id)))
    .reduce((sum, [, v]) => sum + v, 0)

  const txnFeeActual = parseFloat(feeActual[0]?.total || '0')
  const txnFeeBudget = budgets.find((b: { categoryId: number; budgeted: number }) => b.categoryId === -1)?.budgeted ?? defaultsMap[-1] ?? 0

  return NextResponse.json({
    rows,
    transactionFees: {
      categoryId: -1,
      name: 'Transaction Fees',
      budgeted: txnFeeBudget,
      actual: txnFeeActual,
      remaining: txnFeeBudget - txnFeeActual,
      status: txnFeeBudget > 0 ? (txnFeeActual > txnFeeBudget ? 'red' : 'green') : 'unset',
    },
    uncategorizedActual,
    paceRatio,
    currentDay,
    daysInMonth,
  })
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { month, categoryId, budgeted } = await req.json()

  const result = await prisma.personalBudget.upsert({
    where: { month_categoryId: { month, categoryId } },
    update: { budgeted },
    create: { month, categoryId, budgeted },
  })

  return NextResponse.json(result)
}

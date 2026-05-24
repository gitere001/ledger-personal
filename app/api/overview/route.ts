import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const months = parseInt(searchParams.get('months') || '6')

  const now = new Date()
  const results = []

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1))
    const start = d.toISOString()
    const end = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0, 23, 59, 59, 999)).toISOString()
    const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    const label = d.toLocaleString('default', { month: 'short', timeZone: 'UTC' })

    const [incomeRows, expenseRows, feeRows, savingsRows] = await Promise.all([
      prisma.$queryRaw<{ total: string }[]>`
        SELECT COALESCE(SUM(s."totalAmount"), 0) AS total
        FROM sales s
        WHERE s."companyId" = 5 AND s."status" = 'active'
          AND s."saleDate" >= ${start}::timestamptz AND s."saleDate" <= ${end}::timestamptz
      `,
      prisma.$queryRaw<{ total: string }[]>`
        SELECT COALESCE(SUM(e."totalAmount"), 0) AS total
        FROM expenses e
        WHERE e."companyId" = 5 AND e."isReversal" = false
          AND e."expenseDate" >= ${start}::timestamptz AND e."expenseDate" <= ${end}::timestamptz
      `,
      prisma.$queryRaw<{ total: string }[]>`
        SELECT COALESCE(SUM(ct."transactionFee"), 0) AS total
        FROM cash_transactions ct
        WHERE ct."companyId" = 5 AND ct."isReversal" = false
        AND (
          (ct."referenceType" = 'expense' AND ct."referenceId" IN (
            SELECT id FROM expenses
            WHERE "companyId" = 5 AND "isReversal" = false
              AND "expenseDate" >= ${start}::timestamptz AND "expenseDate" <= ${end}::timestamptz
          ))
          OR
          (ct."referenceType" NOT IN ('expense', 'sale', 'opening_balance', 'loan')
           AND ct."transactionFee" > 0
           AND ct."transactionDate" >= ${start}::timestamptz AND ct."transactionDate" <= ${end}::timestamptz)
        )
      `,
      prisma.$queryRaw<{ total: string }[]>`
        SELECT COALESCE(SUM(ps.amount), 0) AS total
        FROM personal_savings ps
        WHERE ps.date >= ${start}::timestamptz AND ps.date <= ${end}::timestamptz
      `,
    ])

    results.push({
      month: monthKey,
      label,
      income: parseFloat(incomeRows[0]?.total || '0'),
      expenses: parseFloat(expenseRows[0]?.total || '0') + parseFloat(feeRows[0]?.total || '0'),
      savings: parseFloat(savingsRows[0]?.total || '0'),
    })
  }

  // Current cash balance
  const balanceRows = await prisma.$queryRaw<{ total: string }[]>`
    SELECT COALESCE(SUM(balance), 0) AS total
    FROM cash_bank_accounts
    WHERE "companyId" = 5 AND "isActive" = true
  `
  const cashBalance = parseFloat(balanceRows[0]?.total || '0')

  return NextResponse.json({ months: results, cashBalance })
}

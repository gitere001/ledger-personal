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

  // Last month to date — same day range as current month, one month back
  const today = now.getUTCDate()
  const lmYear = now.getUTCMonth() === 0 ? now.getUTCFullYear() - 1 : now.getUTCFullYear()
  const lmMonth = now.getUTCMonth() === 0 ? 11 : now.getUTCMonth() - 1
  const daysInLM = new Date(Date.UTC(lmYear, lmMonth + 1, 0)).getUTCDate()
  const lmDay = Math.min(today, daysInLM)

  const lmtdStart = new Date(Date.UTC(lmYear, lmMonth, 1, 0, 0, 0, 0)).toISOString()
  const lmtdEnd = new Date(Date.UTC(lmYear, lmMonth, lmDay, 23, 59, 59, 999)).toISOString()

  const [lmtdIncomeRows, lmtdExpenseRows, lmtdFeeRows, lmtdSavingsRows, lmtdCashNetRows] = await Promise.all([
    prisma.$queryRaw<{ total: string }[]>`
      SELECT COALESCE(SUM(s."totalAmount"), 0) AS total
      FROM sales s
      WHERE s."companyId" = 5 AND s."status" = 'active'
        AND s."saleDate" >= ${lmtdStart}::timestamptz AND s."saleDate" <= ${lmtdEnd}::timestamptz
    `,
    prisma.$queryRaw<{ total: string }[]>`
      SELECT COALESCE(SUM(e."totalAmount"), 0) AS total
      FROM expenses e
      WHERE e."companyId" = 5 AND e."isReversal" = false
        AND e."expenseDate" >= ${lmtdStart}::timestamptz AND e."expenseDate" <= ${lmtdEnd}::timestamptz
    `,
    prisma.$queryRaw<{ total: string }[]>`
      SELECT COALESCE(SUM(ct."transactionFee"), 0) AS total
      FROM cash_transactions ct
      WHERE ct."companyId" = 5 AND ct."isReversal" = false
      AND (
        (ct."referenceType" = 'expense' AND ct."referenceId" IN (
          SELECT id FROM expenses
          WHERE "companyId" = 5 AND "isReversal" = false
            AND "expenseDate" >= ${lmtdStart}::timestamptz AND "expenseDate" <= ${lmtdEnd}::timestamptz
        ))
        OR
        (ct."referenceType" NOT IN ('expense', 'sale', 'opening_balance', 'loan')
         AND ct."transactionFee" > 0
         AND ct."transactionDate" >= ${lmtdStart}::timestamptz AND ct."transactionDate" <= ${lmtdEnd}::timestamptz)
      )
    `,
    // Savings balance as of LMTD cutoff (all-time deposits/interest minus withdrawals up to that date)
    prisma.$queryRaw<{ total: string }[]>`
      SELECT
        COALESCE(SUM(CASE WHEN type IN ('deposit', 'interest') THEN amount ELSE 0 END), 0) -
        COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0) AS total
      FROM personal_savings
      WHERE date <= ${lmtdEnd}::timestamptz
    `,
    // Net principal movement in cash_transactions AFTER the LMTD cutoff
    // Used to rewind current cash balance back to that point in time
    prisma.$queryRaw<{ net: string }[]>`
      SELECT COALESCE(SUM(
        CASE
          WHEN "transactionType" = 'credit' AND "isReversal" = false THEN  amount
          WHEN "transactionType" = 'debit'  AND "isReversal" = false THEN -amount
          WHEN "transactionType" = 'credit' AND "isReversal" = true  THEN -amount
          WHEN "transactionType" = 'debit'  AND "isReversal" = true  THEN  amount
          ELSE 0
        END
      ), 0) AS net
      FROM cash_transactions
      WHERE "companyId" = 5 AND "transactionDate" > ${lmtdEnd}::timestamptz
    `,
  ])

  const lmtdIncome = parseFloat(lmtdIncomeRows[0]?.total || '0')
  const lmtdExpenses = parseFloat(lmtdExpenseRows[0]?.total || '0') + parseFloat(lmtdFeeRows[0]?.total || '0')
  const lmtdSavings = parseFloat(lmtdSavingsRows[0]?.total || '0')
  const lmtdCashBalance = cashBalance - parseFloat(lmtdCashNetRows[0]?.net || '0')

  const lmtdStartLabel = new Date(lmtdStart).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const lmtdEndLabel = new Date(lmtdEnd).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })

  return NextResponse.json({
    months: results,
    cashBalance,
    lastMonthToDate: {
      income: lmtdIncome,
      expenses: lmtdExpenses,
      savings: lmtdSavings,
      cashBalance: lmtdCashBalance,
      dateRange: `${lmtdStartLabel} – ${lmtdEndLabel}`,
    },
  })
}

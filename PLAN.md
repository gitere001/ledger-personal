# Ledger Personal — Build Plan

## Current State (≈40% done)
- Login (gitere.dev@gmail.com only)
- Single dashboard page with 6-month chart, budget vs actual table, savings log
- Budget API with defaults + smart pace status
- Savings API (add / delete)

---

## Target Architecture

### Layout
- **Collapsible sidebar** (full labels when open, icon-only when collapsed)
- **Main content area** fills the rest of the screen
- Sidebar state persisted in localStorage (remembers last open/closed)
- Dark theme throughout (gray-950 base, already established)

### Sidebar Navigation Items
| Icon | Label | Route | Notes |
|------|-------|-------|-------|
| BarChart2 | Dashboard | /dashboard | Overview, charts, KPIs |
| Wallet | Budget | /budget | Budget vs actual table |
| PiggyBank | Savings | /savings | Savings log + transactions |
| *(slot)* | *(future)* | — | Easy to add new items |

---

## Page Designs

### 1. Dashboard (`/dashboard`)
**4 stat cards (top row):**
1. Total Spent This Month
2. Cash Balance (live from cash_bank_accounts)
3. Budget Remaining (budgeted total − actual total)
4. Total Savings Balance (deposits + interest − withdrawals)

**Charts:**
- 6-month bar chart: Income vs Expenses per month (already built, needs cleaner UI)
- Donut/gauge: This month's spend as % of budget

**No budget table here** — that moves to its own page.

---

### 2. Budget (`/budget`)
**4 stat cards:**
1. Total Budgeted (sum of all category budgets)
2. Total Spent (actual)
3. Remaining (budgeted − actual)
4. Pace indicator — e.g. "77% through month, 88% of budget used" (status: red/green)

**Budget vs Actual table** (existing, moved here)
- Inline editable budget cells
- Status dots (green / yellow / red)
- Month selector

---

### 3. Savings (`/savings`)
**4 stat cards:**
1. Total Deposited (sum of all deposits)
2. Total Interest Earned (sum of all interest entries)
3. Total Balance (deposits + interest − withdrawals)
4. Total Withdrawn

**Transaction log table:**
- Columns: Date | Type | Amount | Note | Actions
- Types: Deposit (green) | Interest (blue) | Withdrawal (red)
- Sorted newest first

**Actions (top right buttons):**
- `+ Deposit` — amount, date, where (e.g. "Equity Bank")
- `+ Interest` — amount, date, note (e.g. "Monthly interest")
- `+ Withdrawal` — amount, date, reason

---

## Data Model Change — `personal_savings`

Current schema only supports deposits. Need to extend:

```
personal_savings:
  id          SERIAL PK
  date        TIMESTAMP
  amount      FLOAT
  type        VARCHAR   -- 'deposit' | 'interest' | 'withdrawal'
  note        VARCHAR   -- replaces current "where" field (more general)
  createdAt   TIMESTAMP
  updatedAt   TIMESTAMP
```

Migration path:
- Add `type` column, default existing rows to 'deposit'
- Add `note` column, copy `where` values into it
- Drop `where` column (or keep as alias until UI is updated)

**Balance formula:**
```
balance = SUM(amount WHERE type='deposit')
        + SUM(amount WHERE type='interest')
        - SUM(amount WHERE type='withdrawal')
```

---

## Open Questions to Decide Before Coding

1. **Savings scope** — is this one global savings pool, or should we support multiple "pots" (e.g. "Equity", "M-Pesa lock savings")? Starting with one pool is simpler.

2. **Interest entry** — is it always manual (you type in the amount the bank credited), or should we ever auto-calculate? Manual seems right for now.

3. **Withdrawal** — does a withdrawal reduce the balance only, or should it also show up as a cash inflow somewhere? For now: just reduces savings balance, no cross-posting.

4. **Dashboard charts** — do you want the 6-month chart to show savings as a separate bar/line, or keep it income vs expenses only?

5. **Month selector on Budget page** — keep the existing one (last 12 months dropdown), or add prev/next arrows?

6. **Mobile** — is this desktop-only or should the sidebar work on mobile (hamburger menu)?

---

## Build Order (once plan is approved)

1. Sidebar layout component + routing (Dashboard / Budget / Savings)
2. Dashboard page — stat cards + refactored chart
3. Budget page — move existing table + add stat cards
4. DB migration — extend personal_savings table
5. Savings API — update for type + note fields
6. Savings page — stat cards + transaction log + 3 modals

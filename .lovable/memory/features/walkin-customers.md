---
name: Walk-in Customers & Conversion
description: Three-mode POS customer selection (walk-in default / existing / new), walk-in fields on invoices, debt blocked for walk-ins, repeat detection & conversion
type: feature
---
## Customer modes on POS (`src/pages/NewInvoice.tsx`)
`customerMode: "walkin" | "existing" | "new"` — **walk-in is the default**.
- Walk-in: optional phone + name only. No customer record created. Invoice is booked against the single shared `customers` row with `customer_type = 'walk_in'`, and the details are stored on `invoices.walkin_name` / `invoices.walkin_phone`.
- Existing: autocomplete by name/code/phone/PIN, shows outstanding / good-standing, credit limit, terms, lifetime spend.
- New: inline name/phone/PIN creates a `regular` customer at save time.

## Debt rule
Debt (balance > 0) is **never allowed on a walk-in sale** — the POS blocks it and tells the agent to pick or create a customer account.

## Repeat detection & conversion
- `src/hooks/useWalkins.ts` — `useWalkinHistory(phone)` counts prior invoices with the same `walkin_phone` (visits, total spent, last name used).
- `src/components/WalkinConvertDialog.tsx` — creates the customer and optionally calls RPC `convert_walkin_to_customer(p_phone, p_customer_id)`, which reassigns **all** past walk-in invoices with that phone and recalculates total_spent / current_balance / visit_count.
- `useInvoices` returns `is_walkin` and prefers `walkin_name` / `walkin_phone` for display.

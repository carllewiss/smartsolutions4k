# Unified Purchase & Payables Workspace

One supplier document can carry stock, expense, service and asset lines. Each line decides what happens to inventory, the asset register and the ledger. Payment becomes a separate document that settles the supplier liability, with transaction charges booked as their own expense.

## Phase 1 — Data foundation

- Add `line_type` to purchase lines: `stock | expense | service | asset`, plus per-line fields for expense account, asset category, useful life and warehouse.
- Line-level VAT treatment: `standard | zero_rated | exempt | custom` with the rate stored per line, so the invoice can produce a VAT breakdown.
- New `supplier_payments` and `supplier_payment_allocations` tables: payment date, method (cash / M-Pesa / bank), payment account, reference, amount, charge type, charge amount, charge account, and allocations to one or more purchase invoices.
- Purchase invoice gains `amount_paid` and a derived payment status (unpaid / partial / paid).
- Posting function `post_purchase` extended to walk lines by type:
  - stock → FIFO batch + stock movement tagged with the purchase
  - expense / service → expense account debit
  - asset → row in `fixed_assets` (existing register), no inventory
  - all VAT → input VAT, balance → accounts payable
- `pay_supplier` function posts: Dr Accounts Payable (allocated total), Dr charge expense (charge), Cr payment account (total + charge). Original invoice untouched.
- Chart-of-accounts additions for bank/transaction charges; admin-configurable default account per charge type in settings.
- RLS/grants: admins write, agents read.

## Phase 2 — New Purchase workspace

Rebuild `NewPurchaseInvoice` as a single entry screen:

- Header: supplier, supplier invoice no., date, warehouse.
- One search box across products, services, expense categories and asset categories, with a type badge on every result and an inline "New Item" modal (item type, category, VAT treatment, accounts).
- Line grid: TYPE badge, description, qty, unit cost, VAT treatment, line total; type-specific extra fields (expense account, asset category + useful life, warehouse for stock).
- Totals card with VAT breakdown by treatment.
- Settlement card: terms, due date, optional pay-now with method, payment account, reference and payment charge (checkbox reveals charge type / amount / account).
- Save draft, then Post.

## Phase 3 — Payables

- `/purchases/payments` — supplier payment screen: pick supplier, see outstanding invoices, enter amount + method + payment account + reference + charge, allocate automatically (oldest first) or manually.
- `/purchases/payables` — AP aging: Current, 1–30, 31–60, 61–90, 90+, highest first.
- Supplier 360 (`/purchases/suppliers/:id`): totals purchased, paid, outstanding, overdue; tabs for Purchases, Payments (with charge column), Statement, Products bought.
- Purchase dashboard KPIs: purchases this month, stock received, input VAT, payable outstanding; recent purchases list with Mixed / Stock / Expense type badges and status pills.

## Phase 4 — Detail view and reports

- Purchase detail panel gains Lines-by-type, Payments and VAT breakdown tabs alongside existing Batches / GL / Files.
- Purchase reports: spend by supplier, VAT claimed by supplier, stock purchased by supplier, cost history per product.

## Notes

- Existing purchase orders and GRN-style receiving stay as they are; the new workspace is the "receive + invoice" fast path, with the PO → GRN → Invoice chain still available for large orders.
- Nothing is stored as a JSON blob — everything is relational so supplier, batch, VAT and cost questions can be queried directly.
- Sidebar reorganised to: Purchase Invoices, New Purchase, Supplier Payments, Supplier Statements, Payables Aging, Purchase Reports.

Phases ship in order; each one is usable on its own.

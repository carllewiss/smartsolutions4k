---
name: Customer Management & Credit Suspension
description: Admin add/edit customers (location, PIN, credit limit, terms), auto-suspension over limit/overdue, invoice approval queue
type: feature
---
## Customer Fields
- `customers.location` (text), `customers.is_suspended` (bool, manual admin override)
- Existing: phone, email, kra_pin, debt_limit (credit limit), credit_terms (days)
- Add via `AddCustomerDialog` (Customers page, admin-only button). Edit via `EditCustomerDialog` (Customer 360 / CustomerQuery page) — includes a Suspend toggle.

## Suspension Logic — `src/lib/customerStatus.ts`
`getCustomerCreditStatus(customer, invoices)` returns `suspended` when ANY of:
- overLimit: current_balance > debt_limit (debt_limit > 0)
- overdue: any unpaid invoice older than credit_terms days has balance > 0
- manualSuspended: customers.is_suspended = true
Suspended badge shown on Customers list.

## Invoice Approval Queue
- `invoices.approval_status` text default 'approved' (values: approved | pending), `invoices.approval_reason` text.
- NewInvoice: if existing customer is suspended AND new invoice has balance > 0 (credit/debt), invoice is saved with approval_status='pending'. Stock IS still deducted and customer balance updated on creation (reservation). Button label becomes "Submit for Approval".
- New-customer sales are never held (no history).
- Pending invoices show "PENDING APPROVAL" badge in Invoices list and Print is disabled until approved.
- `/approvals` page (admin-only, `Approvals.tsx`, sidebar item with pending-count badge). Hooks in `src/hooks/useInvoiceApprovals.ts`:
  - Approve → sets approval_status='approved' (releases for printing).
  - Reject → restores stock (new stock_batches), reverses customer balance/total_spent/visit_count, deletes invoice (items cascade).

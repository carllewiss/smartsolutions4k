---
name: Credit, Tax & Payment Allocation
description: Credit limit enforcement, global eTIMS/VAT toggle, FIFO lump-sum payment allocation, searchable autocomplete
type: feature
---
## Credit Limit Enforcement
- Checks `current_balance + new_balance <= debt_limit` before invoice creation
- Blocks debt sales when exceeded; warning shown in UI
- `credit_terms` column on customers (default 30 days)

## Global eTIMS/VAT Toggle
- `system_settings` table with key-value pairs
- `etims_enabled` toggle: when ON, VAT auto-calculated on standard-rated products
- KRA PIN mandatory for repeat customers when eTIMS is on
- Products have `tax_category` enum: standard, zero_rated, exempt
- VAT-inclusive prices shown in product search when eTIMS active

## FIFO Payment Allocation
- PaymentDialog component with Auto-Allocate (oldest first) and Manual modes
- `useFIFOPayment.ts` hook with `autoAllocateFIFO()` utility
- Updates invoice balances and customer `current_balance` atomically

## Searchable Autocomplete
- Product search: fuzzy match by name/category with debounced dropdown
- Customer search: matches name, customer_code, phone, KRA PIN
- Inline "Add New Customer" when no match found
- Debt badge shown on customer search results

## Settings Page
- Admin-only `/settings` route
- eTIMS toggle, default VAT rate, business name

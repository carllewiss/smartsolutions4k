---
name: Receivables & Printing
description: AR debtor list page, Jan-Dec accounting period, and document print isolation rules
type: feature
---
**Accounting period** = 1 January – 31 December. `FinancialStatements.tsx` defaults to the "Financial Year (Jan–Dec)" preset with a year picker.

**Receivables** at `/receivables` (`Receivables.tsx`): debtor list sorted by highest outstanding, aging buckets current/14/30/60/90+, KPI strip, bar + donut charts, paginated table (10/page), right-hand customer detail panel. Agents view only; admin gets "Receive Payment".

**Printing**: all print buttons call `printDocument()` from `src/lib/print.ts`, which toggles `body.printing-invoice`. Global `@media print` rules in `index.css` hide sidebar/toasts/popovers, flatten dialogs, and remove scroll containers/scrollbars.

**B5 invoice = 4 pages**: 1 customer copy (invoice + delivery note) + 1 file copy (invoice + delivery note). Thermal = 1 receipt only.

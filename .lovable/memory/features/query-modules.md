---
name: Query Modules
description: Stock Query and Customer 360 master-detail pages with movements, aging, and notes
type: feature
---
**Stock Query** at `/inventory/:productId` (`StockQuery.tsx`)
- 3-column details card + tabs (Movements / Warehouse Values).
- Movements feed = union of `invoice_items` (SALE) + `stock_batches` (REC), built in `useProductMovements`.
- Admins see avg FIFO cost, batch costs, supplier names; agents do NOT.
- Edit/Delete dialogs (admin only). Delete blocked if product has invoice_items or batches.
- Shared `<ProductFormDialog />` powers both Add and Edit.

**Customer 360** at `/customers/:customerId` (`CustomerQuery.tsx`)
- Aging buckets: current / 30 / 60 / 90 / 120+ from unpaid invoice age.
- Recharts BarChart visualizes aging.
- `customer_notes` table (admin write/edit/delete; agents view + insert).
- Bottom tabs: invoices + payments history.
- Customer rows in `Customers.tsx` are clickable → routes here.

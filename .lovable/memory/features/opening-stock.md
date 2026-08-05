---
name: Opening Stock loading
description: How pre-system inventory is loaded — Opening Stock page, post_opening_stock RPC, Inventory Dr / Owner Capital Cr, never via fake supplier purchases
type: feature
---
# Opening Stock

- Admin-only page at `/inventory/opening-stock` (`src/pages/OpeningStock.tsx`), hook `src/hooks/useOpeningStock.ts`.
- Manual grid + Excel/CSV upload (columns: Product Name, Quantity, Unit Cost (KES)), matched case-insensitively on product name. Template download provided.
- RPC `post_opening_stock(p_items jsonb, p_entry_date, p_notes)`: admin-only, creates one `stock_batches` row per line (so FIFO cost is correct) and posts ONE journal — Dr 1200 Inventory / Cr 3000 Owner Capital. No supplier, no VAT, no payable, no cash movement. Services are rejected.
- Each run is audited in `opening_stock_runs` (entry_date, item_count, total_value, journal_id, created_by).
- Never load opening stock as a purchase invoice from a fake supplier — that creates a false payable/cash outflow.

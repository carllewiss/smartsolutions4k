## Supplier Procurement Module

A complete procurement workflow: Purchase Orders → Goods Receipts → Purchase Invoices, with draft state, receipt attachments, VAT/withholding tax capture, and monthly receipt PDF compilation. Inspired by the uploaded mockup.

### What you get

**1. Purchase Orders (PO)**
- Create PO with supplier, expected delivery date, line items (autocomplete product search like the mockup), unit cost, VAT %, withholding tax %
- Save as **Draft** (editable) or **Issued** (sent to supplier, locked from edits except cancel)
- PO number auto-generated (`PO/2026/0001`)
- Convert PO → Purchase Invoice in one click (carries lines, VAT, supplier)

**2. Purchase Invoices (Bills)**
- Matches the mockup: supplier picker w/ balance, invoice #, date, payment terms, due date, payment mode (Credit/Cash/M-Pesa), reference field
- Line items table with **autocomplete product search**, qty, unit cost, VAT % per line, line total
- Right-side cards: Invoice Summary, Supplier Info, Recent Purchases
- Captures: subtotal, total VAT, withholding tax (2% optional), grand total
- Posts to GL automatically (existing trigger handles it; we extend for VAT input + WHT)
- Adjusts stock: creates `stock_batches` for the received qty at the entered unit cost (FIFO-ready)
- Status: `draft` (no stock impact, no GL) → `posted` (stock + GL committed, immutable)

**3. Receipt Attachments**
- Upload one or more receipt files (JPG/PNG/PDF, ≤5MB each) per purchase invoice
- Stored in a new `purchase-receipts` Cloud storage bucket (private, admin-only)
- Per-invoice: view, download, print single receipt
- **Monthly compilation**: pick a month → generate a single PDF combining every receipt image for that month, with a cover page (totals by supplier) — downloadable & reprintable

**4. Suppliers panel (light upgrade)**
- Existing `suppliers` table reused; add quick balance view (sum of unpaid bills)
- Already-built supplier creation dialog reused

### Where it lives

- New sidebar group **Purchases** with: Purchase Orders, Purchase Invoices, GRN/Receipts, Suppliers, Monthly Receipts PDF
- Existing simple `Purchases.tsx` becomes the **Purchase Invoices** list (upgraded)
- All admin-only (sales agents see nothing new)

### Technical details

**Database (one migration):**
- `purchase_orders` (id, po_number, supplier_id, status[draft|issued|received|cancelled|invoiced], order_date, expected_date, subtotal, vat_total, wht_total, total, notes, reference, created_by)
- `purchase_order_items` (id, po_id, product_id, description, quantity, unit_cost, vat_rate, vat_amount, line_total)
- Extend `purchases` table: add `status`(draft|posted), `invoice_number`, `invoice_date`, `due_date`, `payment_terms_days`, `payment_mode`, `reference`, `vat_total`, `wht_total`, `subtotal`, `notes`, `po_id` (nullable FK), `posted_at`
- Extend `purchase_items`: add `vat_rate`, `vat_amount`, `description`
- New `purchase_receipts` (id, purchase_id, file_path, mime_type, file_size, uploaded_by, uploaded_at)
- New storage bucket `purchase-receipts` (private, admin RLS)
- Sequence functions for `PO/YYYY/####` and `BP/INV/YYYY/####`
- Update `post_purchase_item_journal` trigger to also post VAT input (1300 debit) and WHT (2200 credit) when present, and only fire when parent purchase is `posted`
- Trigger: when purchase moves draft → posted, create `stock_batches` for each line (current code creates batches on insert; we'll move that to a "post" RPC instead)

**RPCs:**
- `create_purchase_draft(payload jsonb)` — header + items, no stock, no GL
- `post_purchase(p_id uuid)` — validates, creates batches, sets status=posted, fires GL
- `convert_po_to_invoice(po_id uuid)` — clones PO into a draft purchase
- `issue_po(po_id uuid)`, `cancel_po(po_id uuid)`

**Frontend:**
- `src/pages/PurchaseOrders.tsx` — list + create/edit dialog
- `src/pages/PurchaseInvoices.tsx` — list (replaces current Purchases page)
- `src/pages/NewPurchaseInvoice.tsx` — full-page form matching the mockup (left form, right summary/supplier/recent cards)
- `src/components/PurchaseLineAutocomplete.tsx` — product search, reuses `useProductWithStock`
- `src/components/PurchaseReceiptsUpload.tsx` — drag/drop, list, delete
- `src/components/MonthlyReceiptsDialog.tsx` — month picker + "Generate PDF" using `pdf-lib` (combines images + cover page)
- `src/hooks/usePurchaseOrders.ts`, extend `src/hooks/usePurchases.ts`
- Sidebar: add Purchases group with sub-items (admin only)

**Misc:**
- Add `#lovable-badge { display: none !important; }` to `src/index.css`
- `pdf-lib` dependency added (no other new deps)

### Out of scope (ask if you want them)
- Supplier payments UI (already partially in Finance — can be extended later)
- Three-way match (PO ↔ GRN ↔ Invoice) — we collapse GRN into the invoice posting step
- OCR on uploaded receipts
- Email PO to supplier

Ready to build?

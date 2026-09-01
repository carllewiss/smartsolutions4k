# Inventory Adjustments, Returns (RMA) & Fixed Assets

Three new modules, built in phases so each one is usable as soon as it lands. All of them post to the existing double-entry GL and keep FIFO batches intact.

## Phase 1 — Inventory Adjustments (the core)

A dedicated module at `/inventory/adjustments` — never a silent stock edit.

**Adjustment types** (each maps to a fixed GL treatment):

| Type | Effect | Posting |
|---|---|---|
| Damaged goods | Reduce | Dr Inventory Loss, Cr Inventory |
| Expired items | Reduce | Dr Expired Stock Expense, Cr Inventory |
| Lost / missing | Reduce | Dr Shrinkage, Cr Inventory |
| Theft | Reduce | Dr Theft Expense, Cr Inventory |
| Promotional giveaway | Reduce | Dr Marketing, Cr Inventory |
| Internal use | Reduce | Dr Office Supplies, Cr Inventory |
| Supplier replacement | Increase | Dr Inventory, Cr Supplier Claims |
| Stock found | Increase | Dr Inventory, Cr Inventory Gain |
| Opening balance correction | Either | Opening Balance Equity |
| Barcode / data correction | No qty change | Audit only |
| Repackaging / unit conversion | Qty change | Internal movement, no P&L |

**Adjustment screen**
- Auto number `ADJ-2026-000021`, type, reason, date, created-by.
- Debounced stock search (name, category, later barcode/SKU) showing on-hand, FIFO cost, selling price, last purchase.
- Multi-line: quantity to adjust, cost auto from FIFO, computed value.
- Reason notes + photo/PDF evidence upload (private storage bucket).
- Save → posts stock movement + journal in one atomic database function.

**FIFO rules**: decreases consume oldest remaining batches (no batch cost rewrite); increases create a new batch at the chosen/last cost. Old layers are never recalculated.

**Item timeline**: the product page gets a unified movement history — purchases, sales, credit notes, adjustments, opening stock — each with its reference number.

## Phase 2 — Analytics & controls

- Dashboard: loss by month, damage by category, top adjusted products.
- Variance detection: shrinkage % trend with a warning when it climbs month over month.
- Frequent-adjustment alert: same product adjusted repeatedly in a week, with the likely-cause checklist.
- Inventory heat map: healthy / low / zero / negative per product.
- Permissions: agents view only; admins create, attach cost, and approve negative-stock adjustments.

## Phase 3 — Returns (RMA)

`/returns` covering customer returns, supplier returns, damaged, expired and wrong-item cases.
- Customer return → restock (or scrap to an adjustment) and generate a **credit note**, **replacement**, or **refund** — reusing the existing credit note engine so the GL stays consistent.
- Supplier return → debit note against the supplier, stock out, AP reduced.
- Status flow: logged → approved → resolved, with photo evidence and printable RMA slip.

## Phase 4 — Fixed Assets

`/assets` register for company-owned computers, printers, routers, furniture, vehicles, UPS and generators.
- Purchase: cost, date, supplier, category, location, serial, warranty, photo.
- Depreciation: straight-line by category with a monthly run that posts Dr Depreciation Expense / Cr Accumulated Depreciation, plus a depreciation schedule per asset.
- Maintenance log: date, provider, cost, notes — costs post to repairs & maintenance.
- Disposal: sale, scrap or write-off with automatic gain/loss on disposal posting.
- Asset register report with net book value.

## Technical notes

- New tables: `inventory_adjustments`, `inventory_adjustment_items`, `returns` + `return_items`, `fixed_assets`, `asset_depreciation`, `asset_maintenance`, `asset_disposals` — all with RLS (admin write, agent read) and GL links.
- New GL accounts for inventory loss, expired stock, shrinkage, theft, inventory gain, supplier claims, accumulated depreciation, depreciation expense, gain/loss on disposal.
- Posting handled by security-definer database functions that call the existing `post_journal`, so every entry flows into Trial Balance, P&L and Balance Sheet automatically.
- Journals stay immutable: corrections are reversals, never edits.
- Evidence files in a private storage bucket with signed-URL access.

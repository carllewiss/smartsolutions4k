---
name: Two-layer pricing + price history
description: Selling price is mutable on products (global update). FIFO cost lives in stock_batches and is never overwritten. Every change to base_sell_price or floor_price is auto-logged in price_history via DB trigger.
type: feature
---
# Pricing Architecture

- `products.base_sell_price` and `products.floor_price` are mutable. Admin edits via ProductFormDialog. Changes apply to all FUTURE sales immediately.
- `stock_batches.cost_price` is the historical/FIFO cost. Never edit; new purchases create new batches.
- `deduct_stock_fifo` RPC pulls from oldest batch first. Profit per sale = invoice_items.unit_price − invoice_items.cogs (already snapshotted at sale time).
- `price_history` table logs every change to base_sell_price or floor_price. Written by trigger `trg_log_product_price_change` (security definer, captures auth.uid()). Admin-only SELECT, no client INSERT.
- Surfaced in StockQuery → "Price History" tab (admin only) via `usePriceHistory` hook.

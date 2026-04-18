---
name: Custom VAT rate per product
description: Admin can override the system-default VAT % on individual products via products.vat_rate (0-100, NULL = use default). Only applies when tax_category = 'standard'.
type: feature
---
# Custom VAT per Product

- `products.vat_rate` is NUMERIC(5,2), nullable, range 0–100 (DB CHECK constraint).
- NULL means "use `system_settings.default_tax_rate`" (currently 16%).
- Only honored when `tax_category = 'standard'`. Zero-rated and exempt are always 0%.
- Admin sets it in `ProductFormDialog` (input is disabled when category isn't standard).
- `NewInvoice` reads `vat_rate` per line item and computes effective % per item; the totals card shows "VAT (mixed rates)" when any line uses an override.
- Inventory tax badge shows `Std 8%` when overridden, plain `Std` otherwise.

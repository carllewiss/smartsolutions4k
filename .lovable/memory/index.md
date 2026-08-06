# Project Memory

## Core
4K Smart Solutions ERP — phone accessories, internet, printing, other services.
KES currency. KRA PIN for VAT. Kenyan business context.
Lovable Cloud backend. RBAC: admin (full) + sales_agent (restricted).
FIFO batch inventory tracking. No localStorage — all data in database.
Theme: Omada teal (primary #00605A) + mint (accent #4DDEBD), bg #F7F8F9. All HSL semantic tokens.
Cost prices visible to admin only; sales agents see selling price + stock only.

## Memories
- [ERP Architecture](mem://features/erp-architecture) — Database schema, FIFO batches, React Query hooks, price override logic
- [Invoicing & Payments](mem://features/invoicing-payments) — Cash/M-Pesa/split/debt payment flows, VAT on KRA PIN
- [Custom VAT per Product](mem://features/custom-vat) — products.vat_rate overrides system default; only for tax_category=standard
- [Debt Tracking](mem://features/debt-tracking) — 14/30/60-day aging reports for customer debts
- [Inventory Analytics](mem://features/inventory-analytics) — Stock classification, low stock alerts, batch-based stock levels
- [Financial Reporting](mem://features/financial-reporting) — P&L with FIFO COGS, expense tracking, gross/net profit
- [eTIMS Integration](mem://features/etims-integration) — KRA eTIMS API for real-time invoice validation (planned)
- [Project Scope](mem://project/scope) — ERP for 4K Smart Solutions Ltd
- [Stock Query & Customer 360](mem://features/query-modules) — Master-detail pages at /inventory/:id and /customers/:id with movements feed, aging chart, notes
- [eTIMS Scaffold](mem://features/etims-scaffold) — Pending sync queue at /etims, reprint watermark, simulated KRA signer until device certs provisioned
- [Pricing Audit](mem://features/pricing-audit) — Mutable selling price + immutable FIFO cost. price_history table auto-logged via trigger, surfaced in StockQuery admin tab.
- [Customer Mgmt & Credit Suspension](mem://features/customer-credit-suspension) — Add/edit customers (location, PIN, limit, terms), auto-suspend over limit/overdue, /approvals invoice queue
- [WiFi Captive Portal](mem://features/wifi-captive-portal) — Syncs Omada WiFi M-Pesa payments + vouchers from separate Supabase project (tyqcalkdvsmeczbbqfns) into /wifi, auto-posts to GL (1030→4020), 15-min cron
- [Walk-in Customers](mem://features/walkin-customers) — Walk-in default POS mode, no account created, debt blocked, repeat detection + conversion of past invoices
- [Opening Stock](mem://features/opening-stock) — Pre-system inventory load: batches + Inventory/Owner Capital journal, Excel upload, never via fake supplier
- [Receivables & Printing](mem://features/receivables-printing) — Debtor list/AR aging page, Jan–Dec accounting period, print isolation rules

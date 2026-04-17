---
name: eTIMS Scaffold
description: Pending sync queue, reprint watermark, simulated KRA signer
type: feature
---
**Database**: `invoices.etims_status` enum (`not_required`/`pending_sync`/`signed`/`failed`), plus `etims_signature`, `etims_qr_data`, `etims_synced_at`, `etims_error`, `reprint_count`, `last_reprinted_at`. Settings keys: `etims_mode`, `etims_device_id`, `etims_kra_pin`.

**Sync Queue** at `/etims` (admin only): lists pending/failed invoices, "Sync to KRA" + "Sync All". Currently calls `useSyncEtimsInvoice` which **simulates** a KRA signer (`KRA-SIM-...` signature). Replace with real edge function call to KRA OSCU when device certs are provisioned.

**Reprint**: `useMarkReprint` increments `reprint_count` + stamps `last_reprinted_at`. `<InvoicePrintView />` renders diagonal REPRINT watermark + "DUPLICATE COPY #N" badge when `isReprint=true`. Shows green ✓ KRA VALIDATED block when `etims_status === 'signed'`.

**Real KRA integration TODO**: replace stub in `useEtims.ts` with a `supabase.functions.invoke('etims-submit', ...)` call. Edge function needs to read OSCU device cert from secrets, format payload per KRA spec (2-decimal rounding via `toFixed(2)`), and update invoice with returned signature.

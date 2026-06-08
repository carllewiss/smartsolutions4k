---
name: WiFi Captive Portal Integration
description: Syncs Omada captive-portal WiFi M-Pesa payments + voucher assignments from a separate Supabase project into the ERP, posts revenue to GL
type: feature
---
# WiFi Captive Portal Integration

Pulls WiFi revenue from a **separate** Omada captive-portal Supabase project into this ERP.

## Source project (read-only, anon key)
- Project ref: `tyqcalkdvsmeczbbqfns`
- `transactions` table: phone_number, amount, package_type, mpesa_receipt, status (`success`/`failed`), voucher_code, created_at, client_mac, ssid. Successful payment = `status='success'` with mpesa_receipt.
- `vouchers` table: code, package_type, duration_hours, status, used_by_mac, used_at, is_used.
- `package_pricing`: 2hour=KSh10, 24hour=KSh30.

## ERP side
- Tables: `wifi_transactions` (payments, admin-read RLS) and `wifi_vouchers` (assignments, admin-read RLS). `remote_id` unique = source row id.
- Edge function `sync-wifi-payments`: fetches source via REST anon key, upserts. Payments use `ignoreDuplicates` so the GL trigger only fires for NEW rows (no double-posting). Vouchers use merge upsert.
- Trigger `post_wifi_journal` (BEFORE INSERT on wifi_transactions): posts journal debit `1030` M-Pesa Till, credit `4020` WiFi/Internet Revenue (dedicated income account). Sets journal_id.
- Cron `sync-wifi-payments-every-15min` runs every 15 min via pg_cron/pg_net.

## UI
- `/wifi` page (admin only, Finance group in sidebar): stat cards, 7-day chart, payments table (time/phone/package/amount/mpesa code/voucher), voucher assignment table, "Sync now" button (useSyncWifi).
- Dashboard admin view: "Today's WiFi" stat card linking to /wifi.
- Hook: `src/hooks/useWifi.ts`.

## Caveats
- Source `transactions.voucher_code` is usually null; voucher↔payment link is weak. Voucher assignment time comes from `vouchers.used_at`, device from `used_by_mac`.

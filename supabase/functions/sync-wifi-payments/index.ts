// Sync WiFi captive-portal payments + voucher assignments into the ERP.
// Pulls from the separate Omada captive-portal Supabase project (read-only,
// anon key) and upserts into this project's wifi_transactions / wifi_vouchers.
// New successful payments auto-post to the GL via the BEFORE INSERT trigger.
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

// ---- Captive portal (source) project ----
const PORTAL_URL = "https://tyqcalkdvsmeczbbqfns.supabase.co";
const PORTAL_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR5cWNhbGtkdnNtZWN6YmJxZm5zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA3NDUxNTYsImV4cCI6MjA4NjMyMTE1Nn0.VTgZPClT7Te2R-9Y6zvtVyDj6pVWRvX7svvvLSx3fcw";

async function portalGet(path: string) {
  const res = await fetch(`${PORTAL_URL}/rest/v1/${path}`, {
    headers: { apikey: PORTAL_ANON, Authorization: `Bearer ${PORTAL_ANON}` },
  });
  if (!res.ok) {
    throw new Error(`Portal fetch failed (${res.status}): ${await res.text()}`);
  }
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const erp = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // ---------- 1. Successful payments (revenue) ----------
    const txns: any[] = await portalGet(
      "transactions?status=eq.success&select=id,phone_number,amount,package_type,mpesa_receipt,voucher_code,status,created_at,authenticated_at,client_mac,ssid&order=created_at.asc",
    );

    let newPayments = 0;
    if (txns.length) {
      const rows = txns.map((t) => ({
        remote_id: t.id,
        phone_number: t.phone_number,
        amount: Number(t.amount) || 0,
        package_type: t.package_type,
        mpesa_receipt: t.mpesa_receipt,
        voucher_code: t.voucher_code,
        status: t.status,
        paid_at: t.created_at,
        authenticated_at: t.authenticated_at,
        client_mac: t.client_mac,
        ssid: t.ssid,
      }));
      // ignoreDuplicates => existing remote_id rows are skipped, so the GL
      // trigger only fires for genuinely new payments (no double-posting).
      const { data, error } = await erp
        .from("wifi_transactions")
        .upsert(rows, { onConflict: "remote_id", ignoreDuplicates: true })
        .select("id");
      if (error) throw error;
      newPayments = data?.length ?? 0;
    }

    // ---------- 2. Voucher assignments (used vouchers) ----------
    const vouchers: any[] = await portalGet(
      "vouchers?is_used=eq.true&select=id,code,package_type,duration_hours,status,used_by_mac,used_at&order=used_at.asc",
    );

    let syncedVouchers = 0;
    if (vouchers.length) {
      const rows = vouchers.map((v) => ({
        remote_id: v.id,
        code: v.code,
        package_type: v.package_type,
        duration_hours: v.duration_hours,
        status: v.status,
        used_by_mac: v.used_by_mac,
        used_at: v.used_at,
      }));
      // Merge upsert so changing voucher state stays current.
      const { error } = await erp
        .from("wifi_vouchers")
        .upsert(rows, { onConflict: "remote_id" });
      if (error) throw error;
      syncedVouchers = rows.length;
    }

    return new Response(
      JSON.stringify({
        success: true,
        newPayments,
        totalPaymentsSeen: txns.length,
        syncedVouchers,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("sync-wifi-payments error:", e);
    return new Response(
      JSON.stringify({ success: false, error: String(e?.message ?? e) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

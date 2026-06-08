import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface WifiTransaction {
  id: string;
  remote_id: string;
  phone_number: string | null;
  amount: number;
  package_type: string | null;
  mpesa_receipt: string | null;
  voucher_code: string | null;
  status: string;
  paid_at: string;
  authenticated_at: string | null;
  client_mac: string | null;
  ssid: string | null;
}

export interface WifiVoucher {
  id: string;
  remote_id: string;
  code: string | null;
  package_type: string | null;
  duration_hours: number | null;
  status: string | null;
  used_by_mac: string | null;
  used_at: string | null;
}

export function useWifiTransactions() {
  return useQuery({
    queryKey: ["wifi_transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wifi_transactions")
        .select("*")
        .order("paid_at", { ascending: false });
      if (error) throw error;
      return (data || []) as WifiTransaction[];
    },
  });
}

export function useWifiVouchers() {
  return useQuery({
    queryKey: ["wifi_vouchers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wifi_vouchers")
        .select("*")
        .order("used_at", { ascending: false });
      if (error) throw error;
      return (data || []) as WifiVoucher[];
    },
  });
}

export function useSyncWifi() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("sync-wifi-payments");
      if (error) throw error;
      if (data && data.success === false) throw new Error(data.error || "Sync failed");
      return data as { newPayments: number; totalPaymentsSeen: number; syncedVouchers: number };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["wifi_transactions"] });
      qc.invalidateQueries({ queryKey: ["wifi_vouchers"] });
      toast({
        title: "WiFi sync complete",
        description: `${data.newPayments} new payment${data.newPayments === 1 ? "" : "s"} pulled · ${data.syncedVouchers} vouchers updated.`,
      });
    },
    onError: (e: any) => {
      toast({ title: "Sync failed", description: String(e?.message ?? e), variant: "destructive" });
    },
  });
}

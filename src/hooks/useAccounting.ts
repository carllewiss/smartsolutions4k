import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAccounts() {
  return useQuery({
    queryKey: ["accounts"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("accounts").select("*").order("code");
      if (error) throw error;
      return data as Array<{ id: string; code: string; name: string; type: string }>;
    },
  });
}

export function useTrialBalance() {
  return useQuery({
    queryKey: ["trial-balance"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("v_trial_balance").select("*");
      if (error) throw error;
      return data as Array<{ account_id: string; code: string; name: string; type: string; total_debit: number; total_credit: number; balance: number }>;
    },
  });
}

export function useJournals(limit = 100) {
  return useQuery({
    queryKey: ["journals", limit],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("journal_entries")
        .select("*, journal_lines(*, accounts(code,name))")
        .order("entry_date", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data;
    },
  });
}

export function useAccountLedger(accountId: string | null) {
  return useQuery({
    queryKey: ["ledger", accountId],
    enabled: !!accountId,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("journal_lines")
        .select("*, journal_entries(entry_date, description, reference_type)")
        .eq("account_id", accountId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });
}

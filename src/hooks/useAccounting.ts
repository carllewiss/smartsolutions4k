import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface GLLine {
  debit: number;
  credit: number;
  entry_date: string;
  code: string;
  name: string;
  type: string; // asset | liability | equity | income | expense
}

/**
 * Pulls every posted journal line with its account + entry date.
 * All financial statements are derived from these GL lines (never from
 * invoices/expenses tables) so adjustments, journals & accruals are included.
 */
export function useGLLines() {
  return useQuery({
    queryKey: ["gl-lines"],
    queryFn: async () => {
      const pageSize = 1000;
      let from = 0;
      const all: GLLine[] = [];
      // paginate to fetch all lines (Supabase caps at 1000 rows/request)
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data, error } = await (supabase as any)
          .from("journal_lines")
          .select("debit, credit, journal_entries!inner(entry_date), accounts!inner(code, name, type)")
          .order("id", { ascending: true })
          .range(from, from + pageSize - 1);
        if (error) throw error;
        const rows = (data || []).map((l: any) => ({
          debit: Number(l.debit) || 0,
          credit: Number(l.credit) || 0,
          entry_date: l.journal_entries?.entry_date,
          code: l.accounts?.code,
          name: l.accounts?.name,
          type: l.accounts?.type,
        })) as GLLine[];
        all.push(...rows);
        if (rows.length < pageSize) break;
        from += pageSize;
      }
      return all;
    },
    staleTime: 60_000,
  });
}


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

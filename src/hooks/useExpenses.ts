import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useExpenses() {
  return useQuery({
    queryKey: ["expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("expense_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreateExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (expense: {
      category: string;
      description?: string;
      amount: number;
      expense_date: string;
      account_id?: string | null;
      payment_account_id?: string | null;
      supplier_id?: string | null;
      vat_amount?: number;
      attachment_url?: string | null;
    }) => {
      const { data, error } = await supabase.from("expenses").insert(expense as any).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["trial-balance"] });
      qc.invalidateQueries({ queryKey: ["journals"] });
    },
  });
}

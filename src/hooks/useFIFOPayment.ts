import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface PaymentAllocation {
  invoice_id: string;
  amount: number;
}

export function useAllocatePayment() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      customer_id: string;
      total_amount: number;
      cash_amount: number;
      mpesa_amount: number;
      allocations: PaymentAllocation[];
      created_by?: string;
    }) => {
      for (const alloc of params.allocations) {
        // Create payment record
        const { error: payErr } = await supabase.from("payments").insert({
          invoice_id: alloc.invoice_id,
          customer_id: params.customer_id,
          amount: alloc.amount,
          cash_amount: Math.min(params.cash_amount, alloc.amount),
          mpesa_amount: Math.max(0, alloc.amount - Math.min(params.cash_amount, alloc.amount)),
          notes: "Debt payment",
          created_by: params.created_by,
        });
        if (payErr) throw payErr;

        // Update invoice
        const { data: inv } = await supabase
          .from("invoices")
          .select("paid_amount, total")
          .eq("id", alloc.invoice_id)
          .single();
        if (inv) {
          const newPaid = Number(inv.paid_amount) + alloc.amount;
          const newBalance = Math.max(0, Number(inv.total) - newPaid);
          await supabase.from("invoices").update({
            paid_amount: newPaid,
            balance: newBalance,
            status: newBalance === 0 ? "paid" : "partial",
          }).eq("id", alloc.invoice_id);
        }
      }

      // Update customer balance
      const { data: cust } = await supabase
        .from("customers")
        .select("current_balance, total_spent")
        .eq("id", params.customer_id)
        .single();
      if (cust) {
        await supabase.from("customers").update({
          current_balance: Math.max(0, Number(cust.current_balance) - params.total_amount),
          total_spent: Number(cust.total_spent) + params.total_amount,
        }).eq("id", params.customer_id);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
    },
  });
}

/** Given unpaid invoices sorted oldest-first, auto-allocate a lump sum */
export function autoAllocateFIFO(
  invoices: Array<{ id: string; balance: number }>,
  amount: number
): PaymentAllocation[] {
  const allocations: PaymentAllocation[] = [];
  let remaining = amount;

  for (const inv of invoices) {
    if (remaining <= 0) break;
    const alloc = Math.min(remaining, inv.balance);
    if (alloc > 0) {
      allocations.push({ invoice_id: inv.id, amount: alloc });
      remaining -= alloc;
    }
  }

  return allocations;
}

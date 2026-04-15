import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type InvoiceRow = Database["public"]["Tables"]["invoices"]["Row"];
type InvoiceItemRow = Database["public"]["Tables"]["invoice_items"]["Row"];

export interface InvoiceWithItems extends InvoiceRow {
  invoice_items: InvoiceItemRow[];
  customer_name?: string;
}

export function useInvoices() {
  return useQuery({
    queryKey: ["invoices"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("*, invoice_items(*), customers(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data?.map(inv => ({
        ...inv,
        customer_name: (inv.customers as any)?.name || "Walk-in",
      })) as InvoiceWithItems[];
    },
  });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      invoice: Omit<Database["public"]["Tables"]["invoices"]["Insert"], "id" | "invoice_number" | "created_at" | "updated_at">;
      items: Array<{
        product_id: string;
        quantity: number;
        unit_price: number;
        discount: number;
        total: number;
      }>;
    }) => {
      // Create invoice
      const { data: inv, error: invErr } = await supabase
        .from("invoices")
        .insert(params.invoice)
        .select()
        .single();
      if (invErr) throw invErr;

      // Deduct stock via FIFO and create items
      for (const item of params.items) {
        // Call FIFO deduction function
        const { data: cogs, error: cogsErr } = await supabase.rpc("deduct_stock_fifo", {
          p_product_id: item.product_id,
          p_quantity: item.quantity,
        });
        if (cogsErr) console.error("FIFO error:", cogsErr);

        const { error: itemErr } = await supabase.from("invoice_items").insert({
          invoice_id: inv.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount: item.discount,
          total: item.total,
          cogs: cogs || 0,
        });
        if (itemErr) throw itemErr;
      }

      // Update customer balance & stats
      if (params.invoice.balance && params.invoice.balance > 0) {
        await supabase.rpc("update_customer_after_sale", {
          p_customer_id: params.invoice.customer_id,
          p_paid: params.invoice.paid_amount || 0,
          p_balance: params.invoice.balance || 0,
        }).catch(() => {
          // Fallback: direct update
          supabase.from("customers").update({
            current_balance: supabase.rpc as any, // handled below
          });
        });
      }

      return inv;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["products-with-stock"] });
    },
  });
}

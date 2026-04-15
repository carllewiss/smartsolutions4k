import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePurchases() {
  return useQuery({
    queryKey: ["purchases"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*, purchase_items(*, products(name)), suppliers(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useCreatePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      supplier_id: string;
      purchase_date: string;
      notes?: string;
      items: Array<{ product_id: string; quantity: number; unit_cost: number }>;
    }) => {
      const total = params.items.reduce((s, i) => s + i.quantity * i.unit_cost, 0);

      // Create purchase
      const { data: purchase, error: pErr } = await supabase
        .from("purchases")
        .insert({
          supplier_id: params.supplier_id,
          purchase_date: params.purchase_date,
          total,
          notes: params.notes,
        })
        .select()
        .single();
      if (pErr) throw pErr;

      // Create batch and purchase items for each item
      for (const item of params.items) {
        // Create stock batch
        const { data: batch, error: bErr } = await supabase
          .from("stock_batches")
          .insert({
            product_id: item.product_id,
            supplier_id: params.supplier_id,
            quantity_bought: item.quantity,
            quantity_remaining: item.quantity,
            cost_price: item.unit_cost,
            purchase_date: params.purchase_date,
          })
          .select()
          .single();
        if (bErr) throw bErr;

        // Create purchase item linked to batch
        const { error: piErr } = await supabase.from("purchase_items").insert({
          purchase_id: purchase.id,
          product_id: item.product_id,
          batch_id: batch.id,
          quantity: item.quantity,
          unit_cost: item.unit_cost,
          total: item.quantity * item.unit_cost,
        });
        if (piErr) throw piErr;
      }

      return purchase;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["products-with-stock"] });
    },
  });
}

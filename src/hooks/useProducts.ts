import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useProducts() {
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });
}

export function useProductWithStock() {
  return useQuery({
    queryKey: ["products-with-stock"],
    queryFn: async () => {
      const { data: products, error } = await supabase.from("products").select("*").order("name");
      if (error) throw error;

      // Get stock from batches
      const { data: batches, error: bErr } = await supabase
        .from("stock_batches")
        .select("product_id, quantity_remaining");
      if (bErr) throw bErr;

      const stockMap: Record<string, number> = {};
      batches?.forEach(b => {
        stockMap[b.product_id] = (stockMap[b.product_id] || 0) + (b.quantity_remaining || 0);
      });

      return products?.map(p => ({
        ...p,
        stock_on_hand: stockMap[p.id] || 0,
      })) || [];
    },
  });
}

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (product: {
      name: string;
      category: "Phone Accessories" | "Internet Services" | "Printing Services" | "Other Services";
      base_sell_price: number;
      floor_price: number;
      unit: string;
      min_stock: number;
      is_service: boolean;
      tax_category?: string;
    }) => {
      const { data, error } = await supabase.from("products").insert(product).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["products-with-stock"] });
    },
  });
}

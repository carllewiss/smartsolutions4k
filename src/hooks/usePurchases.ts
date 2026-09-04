import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type PurchaseLineType = "stock" | "expense" | "service" | "asset";
export type VatTreatment = "standard" | "zero_rated" | "exempt" | "custom";

export type PurchaseLine = {
  line_type: PurchaseLineType;
  product_id?: string | null;
  description?: string;
  quantity: number;
  unit_cost: number;
  vat_rate: number; // %
  vat_treatment?: VatTreatment;
  expense_account_id?: string | null;
  asset_category?: string | null;
  asset_useful_life?: number | null;
  warehouse?: string | null;
};

export function usePurchases(status?: string) {
  return useQuery({
    queryKey: ["purchases", status ?? "all"],
    queryFn: async () => {
      let q = supabase
        .from("purchases")
        .select("*, purchase_items(*, products(name)), suppliers(name, kra_pin, phone, email)")
        .order("created_at", { ascending: false });
      if (status) q = q.eq("status", status as any);
      const { data, error } = await q;
      if (error) throw error;
      return data as any[];
    },
  });
}

export function usePurchase(id: string | undefined) {
  return useQuery({
    queryKey: ["purchase", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("purchases")
        .select("*, purchase_items(*, products(name)), suppliers(*)")
        .eq("id", id!).single();
      if (error) throw error;
      return data as any;
    },
  });
}

function totals(items: PurchaseLine[], wht: number) {
  let subtotal = 0, vat_total = 0;
  for (const it of items) {
    const lineNet = it.quantity * it.unit_cost;
    const v = lineNet * (it.vat_rate || 0) / 100;
    subtotal += lineNet;
    vat_total += v;
  }
  const total = subtotal + vat_total - wht;
  return { subtotal, vat_total, total };
}

export function useSavePurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (params: {
      id?: string;
      supplier_id: string;
      invoice_number?: string;
      invoice_date: string;
      due_date?: string | null;
      payment_terms_days?: number;
      payment_mode: "credit" | "cash" | "mpesa" | "bank";
      reference?: string;
      notes?: string;
      wht_total?: number;
      po_id?: string | null;
      items: PurchaseLine[];
    }) => {
      const wht = params.wht_total ?? 0;
      const t = totals(params.items, 0);
      let id = params.id;
      const payload: any = {
        supplier_id: params.supplier_id,
        invoice_number: params.invoice_number || undefined,
        invoice_date: params.invoice_date,
        purchase_date: params.invoice_date,
        due_date: params.due_date || null,
        payment_terms_days: params.payment_terms_days ?? 30,
        payment_mode: params.payment_mode,
        reference: params.reference || null,
        notes: params.notes || null,
        wht_total: wht,
        po_id: params.po_id || null,
        subtotal: t.subtotal,
        vat_total: t.vat_total,
        total: t.subtotal + t.vat_total,
        status: "draft" as const,
      };
      if (id) {
        const { error } = await (supabase as any).from("purchases").update(payload).eq("id", id);
        if (error) throw error;
        await (supabase as any).from("purchase_items").delete().eq("purchase_id", id);
      } else {
        const { data, error } = await (supabase as any).from("purchases").insert(payload).select().single();
        if (error) throw error;
        id = data.id;
      }
      const rows = params.items.map(it => {
        const lineNet = it.quantity * it.unit_cost;
        const v = lineNet * (it.vat_rate || 0) / 100;
        return {
          purchase_id: id, product_id: it.product_id, description: it.description ?? null,
          quantity: it.quantity, unit_cost: it.unit_cost, vat_rate: it.vat_rate,
          vat_amount: v, total: lineNet + v,
        };
      });
      if (rows.length) {
        const { error } = await (supabase as any).from("purchase_items").insert(rows);
        if (error) throw error;
      }
      return id!;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["purchases"] }),
  });
}

export function usePostPurchase() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).rpc("post_purchase", { p_id: id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["purchases"] });
      qc.invalidateQueries({ queryKey: ["products-with-stock"] });
      qc.invalidateQueries({ queryKey: ["trial-balance"] });
    },
  });
}

export function usePurchaseReceipts(purchase_id: string | undefined) {
  return useQuery({
    queryKey: ["purchase-receipts", purchase_id],
    enabled: !!purchase_id,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("purchase_receipts")
        .select("*").eq("purchase_id", purchase_id!).order("uploaded_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
}

export function useUploadReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ purchase_id, file }: { purchase_id: string; file: File }) => {
      const ext = file.name.split(".").pop();
      const path = `${purchase_id}/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from("purchase-receipts").upload(path, file, { contentType: file.type });
      if (upErr) throw upErr;
      const { error } = await (supabase as any).from("purchase_receipts").insert({
        purchase_id, file_path: path, file_name: file.name, mime_type: file.type, file_size: file.size,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => qc.invalidateQueries({ queryKey: ["purchase-receipts", v.purchase_id] }),
  });
}

export function useDeleteReceipt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: { id: string; file_path: string; purchase_id: string }) => {
      await supabase.storage.from("purchase-receipts").remove([r.file_path]);
      const { error } = await (supabase as any).from("purchase_receipts").delete().eq("id", r.id);
      if (error) throw error;
      return r;
    },
    onSuccess: (r) => qc.invalidateQueries({ queryKey: ["purchase-receipts", r.purchase_id] }),
  });
}

export async function getReceiptSignedUrl(path: string, expires = 3600) {
  const { data, error } = await supabase.storage.from("purchase-receipts").createSignedUrl(path, expires);
  if (error) throw error;
  return data.signedUrl;
}

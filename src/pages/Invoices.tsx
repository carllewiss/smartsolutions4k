import { useMemo, useState } from "react";
import { useInvoices } from "@/hooks/useInvoices";
import { useMarkReprint } from "@/hooks/useEtims";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Printer, ShieldCheck, Clock, AlertCircle, Undo2 } from "lucide-react";
import { InvoicePrintView } from "@/components/InvoicePrintView";
import { CreditNoteDialog } from "@/components/CreditNoteDialog";
import { VirtualizedTable } from "@/components/VirtualizedTable";
import { ColumnDef } from "@tanstack/react-table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

export default function Invoices() {
  const { data: invoices = [], isLoading } = useInvoices();
  const reprint = useMarkReprint();
  const [printData, setPrintData] = useState<any>(null);

  const statusColor = (s: string) =>
    s === "paid"
      ? "bg-success/10 text-success border-success/20"
      : s === "partial"
      ? "bg-warning/10 text-warning border-warning/20"
      : "bg-destructive/10 text-destructive border-destructive/20";

  const etimsBadge = (s: string) => {
    if (s === "signed")
      return <Badge className="bg-success/10 text-success gap-1"><ShieldCheck className="h-3 w-3" />Signed</Badge>;
    if (s === "pending_sync")
      return <Badge className="bg-warning/10 text-warning gap-1"><Clock className="h-3 w-3" />Pending</Badge>;
    if (s === "failed")
      return <Badge className="bg-destructive/10 text-destructive gap-1"><AlertCircle className="h-3 w-3" />Failed</Badge>;
    return <Badge variant="outline">—</Badge>;
  };

  const openPrint = async (inv: any, asReprint: boolean) => {
    const { data: items } = await supabase
      .from("invoice_items")
      .select("quantity, unit_price, total, products(name)")
      .eq("invoice_id", inv.id);

    let reprintCount = inv.reprint_count || 0;
    if (asReprint) {
      try {
        reprintCount = await reprint.mutateAsync(inv.id);
      } catch (e: any) { toast.error(e.message); return; }
    }

    setPrintData({
      invoiceNumber: inv.invoice_number,
      customerName: inv.customer_name,
      customerPin: inv.customer_kra_pin,
      date: inv.created_at,
      items: (items || []).map((it: any) => ({
        name: it.products?.name || "Item",
        quantity: it.quantity,
        unit_price: Number(it.unit_price),
        total: Number(it.total),
      })),
      subtotal: Number(inv.subtotal),
      tax: Number(inv.tax),
      total: Number(inv.total),
      etimsStatus: inv.etims_status,
      etimsSignature: inv.etims_signature,
      etimsQrData: inv.etims_qr_data,
      isReprint: asReprint || (inv.reprint_count || 0) > 0,
      reprintCount,
      reprintedAt: asReprint ? new Date().toISOString() : inv.last_reprinted_at,
    });
  };

  const columns = useMemo<ColumnDef<any>[]>(() => [
    {
      accessorKey: "invoice_number",
      header: "Invoice #",
      size: 160,
      cell: ({ row }) => (
        <span className="font-medium text-sm">
          {row.original.invoice_number}
          {(row.original.reprint_count || 0) > 0 && (
            <Badge variant="outline" className="ml-2 text-[10px] text-destructive border-destructive/30">
              REPRINT ×{row.original.reprint_count}
            </Badge>
          )}
        </span>
      ),
    },
    {
      accessorKey: "customer_name",
      header: "Customer",
      cell: ({ row }) => <span className="text-sm">{row.original.customer_name}</span>,
    },
    {
      accessorKey: "created_at",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {format(new Date(row.original.created_at), "dd MMM yyyy")}
        </span>
      ),
      size: 120,
    },
    {
      accessorKey: "total",
      header: () => <span className="block text-right w-full">Total</span>,
      cell: ({ row }) => (
        <div className="text-right text-sm">KES {Number(row.original.total).toLocaleString()}</div>
      ),
    },
    {
      accessorKey: "balance",
      header: () => <span className="block text-right w-full">Balance</span>,
      cell: ({ row }) => (
        <div className="text-right text-sm font-medium">
          {Number(row.original.balance) > 0 ? `KES ${Number(row.original.balance).toLocaleString()}` : "—"}
        </div>
      ),
    },
    {
      accessorKey: "payment_method",
      header: "Payment",
      cell: ({ row }) => (
        <Badge variant="outline" className="text-xs capitalize">
          {row.original.payment_method.replace("_", " ")}
        </Badge>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <Badge className={`text-xs capitalize ${statusColor(row.original.status)}`}>
          {row.original.status}
        </Badge>
      ),
    },
    {
      accessorKey: "etims_status",
      header: "eTIMS",
      cell: ({ row }) => etimsBadge(row.original.etims_status),
    },
    {
      id: "actions",
      header: () => <span className="block text-right w-full">Actions</span>,
      enableSorting: false,
      size: 110,
      cell: ({ row }) => (
        <div className="text-right">
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              openPrint(row.original, (row.original.reprint_count || 0) > 0 || row.original.etims_status === "signed");
            }}
          >
            <Printer className="h-3 w-3 mr-1" /> Print
          </Button>
        </div>
      ),
    },
  ], []);

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-heading">Invoices</h1>
      <Card>
        <CardContent className="p-0">
          <VirtualizedTable
            data={invoices}
            columns={columns}
            rowHeight={48}
            height="70vh"
            empty="No invoices yet."
          />
        </CardContent>
      </Card>

      <Dialog open={!!printData} onOpenChange={(o) => !o && setPrintData(null)}>
        <DialogContent className="max-w-4xl p-0 max-h-[90vh] overflow-auto">
          {printData && (
            <>
              <InvoicePrintView {...printData} />
              <div className="p-3 border-t flex justify-end gap-2 sticky bottom-0 bg-background">
                <Button variant="outline" onClick={() => setPrintData(null)}>Close</Button>
                <Button onClick={() => window.print()}>
                  <Printer className="h-4 w-4 mr-1" /> Print
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

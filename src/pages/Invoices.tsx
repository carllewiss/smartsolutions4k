import { useMemo, useState } from "react";
import { useInvoices } from "@/hooks/useInvoices";
import { useMarkReprint } from "@/hooks/useEtims";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Printer, ShieldCheck, Clock, AlertCircle, Undo2, Receipt, FileText } from "lucide-react";
import { InvoiceDocumentPrint, InvoicePrintFormat } from "@/components/InvoiceDocumentPrint";
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
  const [printFormat, setPrintFormat] = useState<InvoicePrintFormat | null>(null);
  const [cnInvoiceId, setCnInvoiceId] = useState<string | null>(null);
  const { isAdmin } = useAuth();


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
      .select("quantity, unit_price, total, products(name, sku)")
      .eq("invoice_id", inv.id);

    const { data: customer } = await supabase
      .from("customers")
      .select("name, phone, kra_pin")
      .eq("id", inv.customer_id)
      .maybeSingle();

    let reprintCount = inv.reprint_count || 0;
    if (asReprint) {
      try {
        reprintCount = await reprint.mutateAsync(inv.id);
      } catch (e: any) { toast.error(e.message); return; }
    }

    setPrintFormat(null);
    setPrintData({
      invoiceNumber: inv.invoice_number,
      customerName: customer?.name || inv.customer_name,
      customerPin: customer?.kra_pin || inv.customer_kra_pin,
      customerPhone: customer?.phone,
      date: inv.created_at,
      dueDate: inv.due_date,
      items: (items || []).map((it: any) => ({
        name: it.products?.name || "Item",
        sku: it.products?.sku,
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
    });
  };

  const doPrint = (fmt: InvoicePrintFormat) => {
    setPrintFormat(fmt);
    setTimeout(() => {
      document.body.classList.add("printing-invoice");
      window.print();
      setTimeout(() => document.body.classList.remove("printing-invoice"), 200);
    }, 200);
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
          {isAdmin && (
            <Button
              size="sm"
              variant="ghost"
              className="text-destructive hover:text-destructive"
              onClick={(e) => { e.stopPropagation(); setCnInvoiceId(row.original.id); }}
            >
              <Undo2 className="h-3 w-3 mr-1" /> Credit
            </Button>
          )}
        </div>
      ),
    },
  ], [isAdmin]);

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

      <Dialog open={!!printData} onOpenChange={(o) => { if (!o) { setPrintData(null); setPrintFormat(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Choose Print Format</DialogTitle>
          </DialogHeader>
          {printData && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Invoice <span className="font-medium text-foreground">{printData.invoiceNumber}</span> — {printData.customerName}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => doPrint("thermal")}
                  className="flex flex-col items-center gap-2 rounded-lg border-2 border-border p-5 text-center transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <Receipt className="h-8 w-8 text-primary" />
                  <span className="font-semibold text-sm">Thermal Receipt</span>
                  <span className="text-xs text-muted-foreground">80mm roll · quick receipt (3 copies)</span>
                </button>
                <button
                  onClick={() => doPrint("b5")}
                  className="flex flex-col items-center gap-2 rounded-lg border-2 border-border p-5 text-center transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <FileText className="h-8 w-8 text-primary" />
                  <span className="font-semibold text-sm">Full Invoice (B5)</span>
                  <span className="text-xs text-muted-foreground">Invoice + Delivery Note · customer + 2 file copies</span>
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Customer gets the original; 2 file copies are marked “COPY” (B5). KRA tax details print at the bottom of every format.
              </p>
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => { setPrintData(null); setPrintFormat(null); }}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Hidden print document — isolated by @media print rules */}
      {printData && printFormat && (
        <div className="hidden print:block">
          <InvoiceDocumentPrint format={printFormat} {...printData} />
        </div>
      )}


      <CreditNoteDialog
        open={!!cnInvoiceId}
        onOpenChange={(o) => !o && setCnInvoiceId(null)}
        invoiceId={cnInvoiceId}
      />
    </div>
  );
}

import { useState } from "react";
import { useInvoices } from "@/hooks/useInvoices";
import { useMarkReprint } from "@/hooks/useEtims";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { format } from "date-fns";
import { Printer, ShieldCheck, Clock, AlertCircle } from "lucide-react";
import { InvoicePrintView } from "@/components/InvoicePrintView";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-heading">Invoices</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Invoice #</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead>
              <TableHead className="text-right">Total</TableHead><TableHead className="text-right">Balance</TableHead>
              <TableHead>Payment</TableHead><TableHead>Status</TableHead><TableHead>eTIMS</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {invoices.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium text-sm">
                    {inv.invoice_number}
                    {(inv.reprint_count || 0) > 0 && (
                      <Badge variant="outline" className="ml-2 text-[10px] text-destructive border-destructive/30">
                        REPRINT ×{inv.reprint_count}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{inv.customer_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(inv.created_at), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-right text-sm">KES {Number(inv.total).toLocaleString()}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{Number(inv.balance) > 0 ? `KES ${Number(inv.balance).toLocaleString()}` : "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs capitalize">{inv.payment_method.replace("_", " ")}</Badge></TableCell>
                  <TableCell><Badge className={`text-xs capitalize ${statusColor(inv.status)}`}>{inv.status}</Badge></TableCell>
                  <TableCell>{etimsBadge(inv.etims_status)}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="ghost" onClick={() => openPrint(inv, (inv.reprint_count || 0) > 0 || inv.etims_status === "signed")}>
                      <Printer className="h-3 w-3 mr-1" /> Print
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">No invoices yet</TableCell></TableRow>}
            </TableBody>
          </Table>
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

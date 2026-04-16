import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useInvoices } from "@/hooks/useInvoices";
import { useAllocatePayment, autoAllocateFIFO } from "@/hooks/useFIFOPayment";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { format, differenceInDays } from "date-fns";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerId: string;
  customerName: string;
  currentBalance: number;
}

export default function PaymentDialog({ open, onOpenChange, customerId, customerName, currentBalance }: Props) {
  const { data: invoices = [] } = useInvoices();
  const allocatePayment = useAllocatePayment();
  const { user } = useAuth();

  const [totalAmount, setTotalAmount] = useState(0);
  const [cashAmount, setCashAmount] = useState(0);
  const [mpesaAmount, setMpesaAmount] = useState(0);
  const [manualAllocations, setManualAllocations] = useState<Record<string, number>>({});
  const [mode, setMode] = useState<"auto" | "manual">("auto");

  const unpaidInvoices = invoices
    .filter(i => i.customer_id === customerId && Number(i.balance) > 0)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  const agingLabel = (dateStr: string) => {
    const days = differenceInDays(new Date(), new Date(dateStr));
    if (days <= 14) return { text: "14d", cls: "bg-success/10 text-success" };
    if (days <= 30) return { text: "30d", cls: "bg-warning/10 text-warning" };
    return { text: "60d+", cls: "bg-destructive/10 text-destructive" };
  };

  const handleAutoAllocate = async () => {
    if (totalAmount <= 0) { toast.error("Enter an amount"); return; }
    const allocations = autoAllocateFIFO(
      unpaidInvoices.map(i => ({ id: i.id, balance: Number(i.balance) })),
      totalAmount
    );
    if (allocations.length === 0) { toast.error("No invoices to allocate to"); return; }

    try {
      await allocatePayment.mutateAsync({
        customer_id: customerId,
        total_amount: totalAmount,
        cash_amount: cashAmount,
        mpesa_amount: mpesaAmount,
        allocations,
        created_by: user?.id,
      });
      toast.success(`KES ${totalAmount.toLocaleString()} allocated to ${allocations.length} invoice(s)`);
      onOpenChange(false);
      resetForm();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleManualAllocate = async () => {
    const allocations = Object.entries(manualAllocations)
      .filter(([, amt]) => amt > 0)
      .map(([invoice_id, amount]) => ({ invoice_id, amount }));

    if (allocations.length === 0) { toast.error("Allocate amounts to invoices"); return; }
    const total = allocations.reduce((s, a) => s + a.amount, 0);

    try {
      await allocatePayment.mutateAsync({
        customer_id: customerId,
        total_amount: total,
        cash_amount: cashAmount,
        mpesa_amount: mpesaAmount,
        allocations,
        created_by: user?.id,
      });
      toast.success(`KES ${total.toLocaleString()} allocated manually`);
      onOpenChange(false);
      resetForm();
    } catch (e: any) { toast.error(e.message); }
  };

  const resetForm = () => {
    setTotalAmount(0);
    setCashAmount(0);
    setMpesaAmount(0);
    setManualAllocations({});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Record Payment — {customerName}</DialogTitle>
          <p className="text-sm text-muted-foreground">Outstanding: <span className="font-bold text-destructive">KES {currentBalance.toLocaleString()}</span></p>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-3">
          <div><Label className="text-xs">Cash</Label><Input type="number" value={cashAmount} onChange={e => { setCashAmount(Number(e.target.value)); setTotalAmount(Number(e.target.value) + mpesaAmount); }} /></div>
          <div><Label className="text-xs">M-Pesa</Label><Input type="number" value={mpesaAmount} onChange={e => { setMpesaAmount(Number(e.target.value)); setTotalAmount(cashAmount + Number(e.target.value)); }} /></div>
          <div><Label className="text-xs">Total</Label><Input type="number" value={totalAmount} readOnly className="bg-muted font-bold" /></div>
        </div>

        <Tabs value={mode} onValueChange={v => setMode(v as "auto" | "manual")}>
          <TabsList className="w-full">
            <TabsTrigger value="auto" className="flex-1">Auto-Allocate (FIFO)</TabsTrigger>
            <TabsTrigger value="manual" className="flex-1">Manual</TabsTrigger>
          </TabsList>

          <TabsContent value="auto" className="space-y-3">
            <p className="text-xs text-muted-foreground">Payment will be applied to the oldest invoices first.</p>
            {unpaidInvoices.length > 0 && (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Invoice</TableHead><TableHead>Date</TableHead><TableHead>Age</TableHead><TableHead className="text-right">Balance</TableHead><TableHead className="text-right">Will Pay</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {(() => {
                    const preview = autoAllocateFIFO(
                      unpaidInvoices.map(i => ({ id: i.id, balance: Number(i.balance) })),
                      totalAmount
                    );
                    return unpaidInvoices.map(inv => {
                      const alloc = preview.find(a => a.invoice_id === inv.id);
                      const aging = agingLabel(inv.created_at);
                      return (
                        <TableRow key={inv.id}>
                          <TableCell className="text-sm font-medium">{inv.invoice_number}</TableCell>
                          <TableCell className="text-xs text-muted-foreground">{format(new Date(inv.created_at), "dd MMM")}</TableCell>
                          <TableCell><Badge className={`text-xs ${aging.cls}`}>{aging.text}</Badge></TableCell>
                          <TableCell className="text-right text-sm">KES {Number(inv.balance).toLocaleString()}</TableCell>
                          <TableCell className="text-right text-sm font-bold">{alloc ? `KES ${alloc.amount.toLocaleString()}` : "—"}</TableCell>
                        </TableRow>
                      );
                    });
                  })()}
                </TableBody>
              </Table>
            )}
            <Button className="w-full" onClick={handleAutoAllocate} disabled={allocatePayment.isPending || totalAmount <= 0}>
              {allocatePayment.isPending ? "Processing..." : `Auto-Allocate KES ${totalAmount.toLocaleString()}`}
            </Button>
          </TabsContent>

          <TabsContent value="manual" className="space-y-3">
            <p className="text-xs text-muted-foreground">Enter amounts for specific invoices.</p>
            {unpaidInvoices.length > 0 && (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Invoice</TableHead><TableHead>Age</TableHead><TableHead className="text-right">Balance</TableHead><TableHead className="w-32">Pay Amount</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {unpaidInvoices.map(inv => {
                    const aging = agingLabel(inv.created_at);
                    return (
                      <TableRow key={inv.id}>
                        <TableCell className="text-sm font-medium">{inv.invoice_number}</TableCell>
                        <TableCell><Badge className={`text-xs ${aging.cls}`}>{aging.text}</Badge></TableCell>
                        <TableCell className="text-right text-sm">KES {Number(inv.balance).toLocaleString()}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            className="h-8 w-28"
                            max={Number(inv.balance)}
                            value={manualAllocations[inv.id] || ""}
                            onChange={e => setManualAllocations(prev => ({ ...prev, [inv.id]: Math.min(Number(e.target.value), Number(inv.balance)) }))}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
            <Button className="w-full" onClick={handleManualAllocate} disabled={allocatePayment.isPending}>
              {allocatePayment.isPending ? "Processing..." : "Allocate Manually"}
            </Button>
          </TabsContent>
        </Tabs>

        {unpaidInvoices.length === 0 && <p className="text-center text-muted-foreground py-4">No outstanding invoices</p>}
      </DialogContent>
    </Dialog>
  );
}

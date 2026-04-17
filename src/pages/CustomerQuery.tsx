import { useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useCustomers } from "@/hooks/useCustomers";
import { useInvoices } from "@/hooks/useInvoices";
import { usePayments } from "@/hooks/usePayments";
import { useCustomerNotes, useCreateCustomerNote, useDeleteCustomerNote } from "@/hooks/useCustomerNotes";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, User, TrendingUp, CreditCard, Trash2, Plus } from "lucide-react";
import { differenceInDays } from "date-fns";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import PaymentDialog from "@/components/PaymentDialog";
import { toast } from "sonner";

const BUCKETS = [
  { key: "current", label: "Current", max: 0, color: "hsl(var(--primary))" },
  { key: "d30", label: "30 days", max: 30, color: "hsl(var(--primary-glow))" },
  { key: "d60", label: "60 days", max: 60, color: "hsl(var(--warning))" },
  { key: "d90", label: "90 days", max: 90, color: "hsl(var(--destructive) / 0.7)" },
  { key: "d120", label: "120+", max: 99999, color: "hsl(var(--destructive))" },
] as const;

export default function CustomerQuery() {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: customers = [] } = useCustomers();
  const { data: invoices = [] } = useInvoices();
  const { data: payments = [] } = usePayments();
  const { data: notes = [] } = useCustomerNotes(customerId);
  const createNote = useCreateCustomerNote();
  const delNote = useDeleteCustomerNote();

  const [newNote, setNewNote] = useState("");
  const [showPay, setShowPay] = useState(false);

  const customer = customers.find((c) => c.id === customerId);
  const customerInvoices = invoices.filter((i) => i.customer_id === customerId);
  const customerPayments = payments.filter((p) => p.customer_id === customerId);

  const aging = useMemo(() => {
    const now = new Date();
    const buckets: Record<string, number> = { current: 0, d30: 0, d60: 0, d90: 0, d120: 0 };
    customerInvoices
      .filter((i) => Number(i.balance) > 0)
      .forEach((i) => {
        const days = differenceInDays(now, new Date(i.created_at));
        const bal = Number(i.balance);
        if (days <= 0) buckets.current += bal;
        else if (days <= 30) buckets.d30 += bal;
        else if (days <= 60) buckets.d60 += bal;
        else if (days <= 90) buckets.d90 += bal;
        else buckets.d120 += bal;
      });
    return buckets;
  }, [customerInvoices]);

  const chartData = BUCKETS.map((b) => ({
    name: b.label,
    value: aging[b.key] || 0,
    color: b.color,
  }));

  const totalDebt = Object.values(aging).reduce((s, v) => s + v, 0);

  if (!customer) {
    return <div className="p-6 text-muted-foreground">Customer not found.</div>;
  }

  const submitNote = async () => {
    if (!newNote.trim()) return;
    try {
      await createNote.mutateAsync({ customerId: customerId!, note: newNote });
      setNewNote("");
      toast.success("Note saved");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-primary text-primary-foreground p-4 rounded-lg flex items-center justify-between shadow-elegant">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => navigate("/customers")} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <User className="h-5 w-5 text-accent" />
          <h1 className="font-bold tracking-tight font-heading">CUSTOMER 360: {customer.name.toUpperCase()}</h1>
        </div>
        {totalDebt > 0 && (
          <Button size="sm" variant="secondary" onClick={() => setShowPay(true)}>
            <CreditCard className="h-4 w-4 mr-1" /> Take Payment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Customer info + aging */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="overflow-hidden">
            <div className="bg-muted px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-muted-foreground flex items-center justify-between">
              Customer Info <User className="h-3 w-3" />
            </div>
            <div className="p-3 text-sm space-y-1.5">
              <p className="flex justify-between border-b py-1"><span className="text-muted-foreground">Code:</span> <span className="font-bold text-primary">{customer.customer_code}</span></p>
              <p className="flex justify-between border-b py-1"><span className="text-muted-foreground">Phone:</span> <span>{customer.phone || "—"}</span></p>
              <p className="flex justify-between border-b py-1"><span className="text-muted-foreground">KRA PIN:</span> <span className="font-mono uppercase text-primary">{customer.kra_pin || "—"}</span></p>
              <p className="flex justify-between border-b py-1"><span className="text-muted-foreground">Total Spent:</span> <span className="font-bold">KES {Number(customer.total_spent).toLocaleString()}</span></p>
              <p className="flex justify-between border-b py-1">
                <span className="text-muted-foreground">Outstanding:</span>
                <span className={`font-bold ${totalDebt > 0 ? "text-destructive" : "text-success"}`}>KES {totalDebt.toLocaleString()}</span>
              </p>
              <p className="flex justify-between border-b py-1"><span className="text-muted-foreground">Credit Limit:</span> <span>KES {Number(customer.debt_limit).toLocaleString()}</span></p>
              <p className="flex justify-between py-1"><span className="text-muted-foreground">Status:</span>
                {customer.kra_pin ? <Badge className="bg-success/10 text-success">Taxable</Badge> : <Badge variant="outline">Non-Taxable</Badge>}
              </p>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="bg-muted px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Aging Summary</div>
            <Table>
              <TableBody>
                {BUCKETS.map((b) => (
                  <TableRow key={b.key}>
                    <TableCell className="text-xs py-1.5">{b.label}</TableCell>
                    <TableCell className="text-right font-mono text-xs py-1.5">{(aging[b.key] || 0).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="bg-muted/30">
                  <TableCell className="text-xs font-bold py-1.5">TOTAL</TableCell>
                  <TableCell className="text-right font-mono font-bold text-xs py-1.5">{totalDebt.toLocaleString()}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </Card>
        </div>

        {/* Middle: Notes */}
        <div className="lg:col-span-4 space-y-4">
          <Card className="overflow-hidden">
            <div className="bg-muted px-3 py-1.5 text-[11px] font-black uppercase tracking-widest text-muted-foreground">Management Notes</div>
            <div className="p-3 space-y-3">
              <div className="space-y-2">
                <Textarea
                  placeholder="Add a note (e.g. payment terms, special arrangement)..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={2}
                  className="text-sm"
                />
                <Button size="sm" onClick={submitNote} disabled={createNote.isPending || !newNote.trim()}>
                  <Plus className="h-3 w-3 mr-1" /> Add Note
                </Button>
              </div>
              <div className="space-y-2 max-h-72 overflow-auto">
                {notes.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">No notes yet.</p>
                ) : (
                  notes.map((n: any) => (
                    <div key={n.id} className="p-2 bg-accent-soft border border-accent/20 rounded text-xs">
                      <p className="text-foreground">{n.note}</p>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {new Date(n.created_at).toLocaleDateString()}
                        </span>
                        {isAdmin && (
                          <Button size="icon" variant="ghost" className="h-5 w-5"
                            onClick={() => delNote.mutate({ id: n.id, customerId: customerId! })}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Right: Aging graph */}
        <div className="lg:col-span-4">
          <Card className="p-4 h-full min-h-[280px]">
            <h3 className="text-[11px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2 mb-3">
              <TrendingUp className="h-3 w-3" /> Invoice Aging Graph
            </h3>
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis fontSize={10} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`} />
                  <Tooltip formatter={(value: number) => `KES ${value.toLocaleString()}`} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {chartData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </div>

      {/* Bottom: tabbed history */}
      <Card className="overflow-hidden">
        <Tabs defaultValue="invoices">
          <TabsList className="rounded-none border-b w-full justify-start bg-muted/30 h-auto p-0">
            <TabsTrigger value="invoices" className="data-[state=active]:bg-background data-[state=active]:border-t-2 data-[state=active]:border-t-primary rounded-none px-6 py-3 text-xs font-bold uppercase">Invoices ({customerInvoices.length})</TabsTrigger>
            <TabsTrigger value="payments" className="data-[state=active]:bg-background data-[state=active]:border-t-2 data-[state=active]:border-t-primary rounded-none px-6 py-3 text-xs font-bold uppercase">Payments ({customerPayments.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="invoices" className="m-0 max-h-96 overflow-auto">
            {customerInvoices.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No invoices yet.</div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-muted/50">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase">Date</TableHead>
                    <TableHead className="text-[10px] uppercase">Invoice #</TableHead>
                    <TableHead className="text-[10px] uppercase text-right">Total</TableHead>
                    <TableHead className="text-[10px] uppercase text-right">Paid</TableHead>
                    <TableHead className="text-[10px] uppercase text-right">Balance</TableHead>
                    <TableHead className="text-[10px] uppercase">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerInvoices.map((inv) => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-xs">{new Date(inv.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="font-bold text-primary text-sm">{inv.invoice_number}</TableCell>
                      <TableCell className="text-right text-sm">KES {Number(inv.total).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm">KES {Number(inv.paid_amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm font-bold">KES {Number(inv.balance).toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={
                          inv.status === "paid" ? "bg-success/10 text-success" :
                          inv.status === "partial" ? "bg-warning/10 text-warning" :
                          "bg-destructive/10 text-destructive"
                        }>{inv.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>

          <TabsContent value="payments" className="m-0 max-h-96 overflow-auto">
            {customerPayments.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No payments yet.</div>
            ) : (
              <Table>
                <TableHeader className="sticky top-0 bg-muted/50">
                  <TableRow>
                    <TableHead className="text-[10px] uppercase">Date</TableHead>
                    <TableHead className="text-[10px] uppercase text-right">Amount</TableHead>
                    <TableHead className="text-[10px] uppercase text-right">Cash</TableHead>
                    <TableHead className="text-[10px] uppercase text-right">M-Pesa</TableHead>
                    <TableHead className="text-[10px] uppercase">Notes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerPayments.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{new Date(p.payment_date).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-bold text-success">+KES {Number(p.amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm">{Number(p.cash_amount).toLocaleString()}</TableCell>
                      <TableCell className="text-right text-sm">{Number(p.mpesa_amount).toLocaleString()}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{p.notes || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TabsContent>
        </Tabs>
      </Card>

      {showPay && (
        <PaymentDialog
          open={showPay}
          onOpenChange={setShowPay}
          customerId={customer.id}
          customerName={customer.name}
          currentBalance={totalDebt}
        />
      )}
    </div>
  );
}

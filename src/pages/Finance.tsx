import { useState } from "react";
import { useInvoices } from "@/hooks/useInvoices";
import { useExpenses, useCreateExpense } from "@/hooks/useExpenses";
import { usePurchases } from "@/hooks/usePurchases";
import { useAccounts } from "@/hooks/useAccounting";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { toast } from "sonner";
import { format } from "date-fns";

const EXPENSE_CATEGORIES = ["Electricity", "Rent", "Internet", "Stock Purchase", "Transport", "Salary", "Marketing", "Maintenance", "Other"];

export default function Finance() {
  const { data: invoices = [] } = useInvoices();
  const { data: expenses = [], isLoading } = useExpenses();
  const { data: purchases = [] } = usePurchases();
  const { data: accounts = [] } = useAccounts();
  const createExpense = useCreateExpense();

  const expenseAccounts = accounts.filter(a => a.type === "expense");
  const paymentAccounts = accounts.filter(a => ["1000","1010","1020","1030","1040","1050"].includes(a.code));

  const [open, setOpen] = useState(false);
  const [accountId, setAccountId] = useState<string>("");
  const [paymentAccountId, setPaymentAccountId] = useState<string>("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);
  const [vatAmount, setVatAmount] = useState(0);

  const totalRevenue = invoices.reduce((s, i) => s + Number(i.total), 0);
  const totalCOGS = invoices.reduce((s, inv) => s + (inv.invoice_items?.reduce((is, item) => is + Number(item.cogs || 0), 0) || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const purchaseCost = purchases.reduce((s, p) => s + Number(p.total), 0);
  const grossProfit = totalRevenue - totalCOGS;
  const netProfit = grossProfit - totalExpenses;

  const expenseByCategory: Record<string, number> = {};
  expenses.forEach(e => { expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + Number(e.amount); });
  const chartData = Object.entries(expenseByCategory).map(([name, amount]) => ({ name, amount }));

  const submit = async () => {
    if (!accountId || !paymentAccountId || amount <= 0) { toast.error("Select account, payment method and amount"); return; }
    const acct = expenseAccounts.find(a => a.id === accountId);
    try {
      await createExpense.mutateAsync({
        category: acct?.name || "Other",
        description,
        amount,
        vat_amount: vatAmount,
        account_id: accountId,
        payment_account_id: paymentAccountId,
        expense_date: new Date().toISOString().split("T")[0],
      });
      toast.success("Expense recorded & posted to GL");
      setOpen(false); setDescription(""); setAmount(0); setVatAmount(0);
    } catch (e: any) { toast.error(e.message); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Profit & Loss</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add Expense</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Expense Account</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger><SelectValue placeholder="Select expense account..." /></SelectTrigger>
                  <SelectContent className="max-h-72">
                    {expenseAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Paid From</Label>
                <Select value={paymentAccountId} onValueChange={setPaymentAccountId}>
                  <SelectTrigger><SelectValue placeholder="Cash / Bank / M-Pesa..." /></SelectTrigger>
                  <SelectContent>
                    {paymentAccounts.map(a => <SelectItem key={a.id} value={a.id}>{a.code} — {a.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label>Amount (KES, incl. VAT)</Label><Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} /></div>
                <div><Label>VAT (KES)</Label><Input type="number" value={vatAmount} onChange={e => setVatAmount(Number(e.target.value))} /></div>
              </div>
              <Button className="w-full" onClick={submit} disabled={createExpense.isPending}>Save & Post to GL</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Revenue</p><p className="text-xl font-bold">KES {totalRevenue.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">COGS (FIFO)</p><p className="text-xl font-bold text-warning">KES {totalCOGS.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Expenses</p><p className="text-xl font-bold text-destructive">KES {totalExpenses.toLocaleString()}</p></CardContent></Card>
        <Card className={netProfit >= 0 ? "border-success/30" : "border-destructive/30"}>
          <CardContent className="p-4">
            <div className="flex items-center gap-1"><p className="text-xs text-muted-foreground">Net Profit</p>{netProfit >= 0 ? <TrendingUp className="h-3 w-3 text-success" /> : <TrendingDown className="h-3 w-3 text-destructive" />}</div>
            <p className={`text-xl font-bold ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>KES {netProfit.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Expenses Breakdown</CardTitle></CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                  <XAxis type="number" fontSize={12} />
                  <YAxis type="category" dataKey="name" fontSize={11} width={80} />
                  <Tooltip formatter={(v: number) => `KES ${v.toLocaleString()}`} />
                  <Bar dataKey="amount" fill="hsl(0 84% 60%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Recent Expenses</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow>
                <TableHead>Date</TableHead><TableHead>Category</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead>
              </TableRow></TableHeader>
              <TableBody>
                {expenses.slice(0, 10).map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs text-muted-foreground">{format(new Date(e.expense_date), "dd MMM")}</TableCell>
                    <TableCell className="text-xs">{e.category}</TableCell>
                    <TableCell className="text-sm">{e.description}</TableCell>
                    <TableCell className="text-right text-sm font-medium">KES {Number(e.amount).toLocaleString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

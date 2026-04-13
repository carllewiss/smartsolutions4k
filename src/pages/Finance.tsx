import { useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, TrendingUp, TrendingDown } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

const EXPENSE_CATEGORIES = ["Electricity", "Rent", "Internet", "Stock Purchase", "Transport", "Salary", "Marketing", "Maintenance", "Other"];

export default function Finance() {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [category, setCategory] = useState("Electricity");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState(0);

  const totalRevenue = store.invoices.reduce((s, i) => s + i.total, 0);
  const totalCOGS = store.invoices.reduce((s, i) => s + i.items.reduce((is, item) => {
    const prod = store.products.find(p => p.id === item.productId);
    return is + (prod ? prod.buyPrice * item.quantity : 0);
  }, 0), 0);
  const totalExpenses = store.expenses.reduce((s, e) => s + e.amount, 0);
  const purchaseCost = store.purchases.reduce((s, p) => s + p.total, 0);
  const grossProfit = totalRevenue - totalCOGS;
  const netProfit = grossProfit - totalExpenses;

  const expenseByCategory: Record<string, number> = {};
  store.expenses.forEach(e => { expenseByCategory[e.category] = (expenseByCategory[e.category] || 0) + e.amount; });
  const chartData = Object.entries(expenseByCategory).map(([name, amount]) => ({ name, amount }));

  const submit = () => {
    if (!description.trim() || amount <= 0) { toast.error("Fill all fields"); return; }
    store.addExpense({ id: `e${Date.now()}`, category, description, amount, date: new Date().toISOString().split("T")[0] });
    toast.success("Expense recorded");
    setOpen(false);
    setDescription("");
    setAmount(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Profit & Loss</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add Expense</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Expense</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{EXPENSE_CATEGORIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Description</Label><Input value={description} onChange={e => setDescription(e.target.value)} /></div>
              <div><Label>Amount (KES)</Label><Input type="number" value={amount} onChange={e => setAmount(Number(e.target.value))} /></div>
              <Button className="w-full" onClick={submit}>Save Expense</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Revenue</p><p className="text-xl font-bold">KES {totalRevenue.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Cost of Goods</p><p className="text-xl font-bold text-warning">KES {totalCOGS.toLocaleString()}</p></CardContent></Card>
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
                {store.expenses.slice(0, 10).map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="text-xs text-muted-foreground">{format(parseISO(e.date), "dd MMM")}</TableCell>
                    <TableCell className="text-xs">{e.category}</TableCell>
                    <TableCell className="text-sm">{e.description}</TableCell>
                    <TableCell className="text-right text-sm font-medium">KES {e.amount.toLocaleString()}</TableCell>
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

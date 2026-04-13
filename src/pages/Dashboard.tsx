import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, Package, AlertTriangle, TrendingUp, TrendingDown, Receipt } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { format, subDays, isAfter, parseISO, differenceInDays } from "date-fns";

const COLORS = ["hsl(243 75% 59%)", "hsl(167 72% 60%)", "hsl(38 92% 50%)", "hsl(0 84% 60%)", "hsl(142 71% 45%)"];

export default function Dashboard() {
  const { invoices, products, customers, expenses, purchases } = useStore();

  const today = new Date();
  const todaySales = invoices.filter(i => i.createdAt.startsWith(format(today, "yyyy-MM-dd")));
  const todayRevenue = todaySales.reduce((s, i) => s + i.paidAmount, 0);
  const totalDebt = invoices.reduce((s, i) => s + i.balance, 0);

  const unpaidInvoices = invoices.filter(i => i.balance > 0);
  const debt14 = unpaidInvoices.filter(i => differenceInDays(today, parseISO(i.createdAt)) <= 14).reduce((s, i) => s + i.balance, 0);
  const debt30 = unpaidInvoices.filter(i => { const d = differenceInDays(today, parseISO(i.createdAt)); return d > 14 && d <= 30; }).reduce((s, i) => s + i.balance, 0);
  const debt60 = unpaidInvoices.filter(i => differenceInDays(today, parseISO(i.createdAt)) > 30).reduce((s, i) => s + i.balance, 0);

  const lowStockProducts = products.filter(p => p.quantity <= p.minStock && p.minStock > 0);

  const totalSalesRevenue = invoices.reduce((s, i) => s + i.total, 0);
  const totalCOGS = invoices.reduce((s, i) => s + i.items.reduce((is, item) => {
    const prod = products.find(p => p.id === item.productId);
    return is + (prod ? prod.buyPrice * item.quantity : 0);
  }, 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const grossProfit = totalSalesRevenue - totalCOGS;
  const netProfit = grossProfit - totalExpenses;

  // Sales by category
  const catMap: Record<string, number> = {};
  invoices.forEach(inv => inv.items.forEach(item => {
    const prod = products.find(p => p.id === item.productId);
    const cat = prod?.category || "Other";
    catMap[cat] = (catMap[cat] || 0) + item.total;
  }));
  const categoryData = Object.entries(catMap).map(([name, value]) => ({ name: name.replace(" Services", "").replace(" Accessories", ""), value }));

  // Last 7 days sales
  const dailySales = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    const ds = format(d, "yyyy-MM-dd");
    const label = format(d, "EEE");
    const revenue = invoices.filter(inv => inv.createdAt.startsWith(ds)).reduce((s, inv) => s + inv.total, 0);
    return { name: label, revenue };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Welcome back — here's your business at a glance</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Today's Sales" value={`KES ${todayRevenue.toLocaleString()}`} sub={`${todaySales.length} invoices`} color="text-success" />
        <StatCard icon={Receipt} label="Total Debt" value={`KES ${totalDebt.toLocaleString()}`} sub={`${unpaidInvoices.length} unpaid`} color="text-warning" />
        <StatCard icon={TrendingUp} label="Net Profit" value={`KES ${netProfit.toLocaleString()}`} sub={netProfit >= 0 ? "Profitable" : "Loss"} color={netProfit >= 0 ? "text-success" : "text-destructive"} />
        <StatCard icon={Package} label="Low Stock" value={String(lowStockProducts.length)} sub="items need restock" color="text-destructive" />
      </div>

      {/* Debt Aging */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">0-14 Days</p>
            <p className="text-lg font-bold text-success">KES {debt14.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">15-30 Days</p>
            <p className="text-lg font-bold text-warning">KES {debt30.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">31-60+ Days</p>
            <p className="text-lg font-bold text-destructive">KES {debt60.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">7-Day Sales Trend</CardTitle></CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailySales}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v: number) => `KES ${v.toLocaleString()}`} />
                  <Bar dataKey="revenue" fill="hsl(243 75% 59%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Sales by Category</CardTitle></CardHeader>
          <CardContent>
            <div className="h-52">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={categoryData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} fontSize={11}>
                    {categoryData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `KES ${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Low stock alert */}
      {lowStockProducts.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Low Stock Alert</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.map(p => (
                <Badge key={p.id} variant="destructive" className="text-xs">
                  {p.name}: {p.quantity} left
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-md bg-muted ${color}`}><Icon className="h-4 w-4" /></div>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-lg font-bold font-heading">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

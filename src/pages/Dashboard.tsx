import { useInvoices } from "@/hooks/useInvoices";
import { useProductWithStock } from "@/hooks/useProducts";
import { useExpenses } from "@/hooks/useExpenses";
import { useWifiTransactions } from "@/hooks/useWifi";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Package, AlertTriangle, TrendingUp, Receipt, ShoppingCart, Users, Wifi } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Link } from "react-router-dom";
import { format, subDays, differenceInDays } from "date-fns";

const COLORS = ["hsl(243 75% 59%)", "hsl(167 72% 60%)", "hsl(38 92% 50%)", "hsl(0 84% 60%)", "hsl(142 71% 45%)"];

export default function Dashboard() {
  const { isAdmin, user, displayName } = useAuth();
  const { data: invoices = [], isLoading: invLoading } = useInvoices();
  const { data: products = [] } = useProductWithStock();
  const { data: expenses = [] } = useExpenses();
  const { data: wifiTxns = [] } = useWifiTransactions();

  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  // Low-stock excludes services (services have no stock)
  const lowStockProducts = products.filter(
    p => !p.is_service && p.stock_on_hand <= p.min_stock && p.min_stock > 0
  );

  // 7-day revenue trend (gross sales — no margin/cost exposed)
  const dailySales = Array.from({ length: 7 }, (_, i) => {
    const d = subDays(today, 6 - i);
    const ds = format(d, "yyyy-MM-dd");
    const label = format(d, "EEE");
    const revenue = invoices
      .filter(inv => inv.created_at?.startsWith(ds) && (isAdmin || inv.created_by === user?.id))
      .reduce((s, inv) => s + Number(inv.total), 0);
    return { name: label, revenue };
  });

  if (invLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  // ─────────────────── AGENT VIEW ───────────────────
  if (!isAdmin) {
    const myToday = invoices.filter(i => i.created_at?.startsWith(todayStr) && i.created_by === user?.id);
    const myTodayRevenue = myToday.reduce((s, i) => s + Number(i.total), 0);
    const myToday7d = invoices.filter(i => {
      if (i.created_by !== user?.id) return false;
      const d = differenceInDays(today, new Date(i.created_at));
      return d >= 0 && d < 7;
    });
    const my7dRevenue = myToday7d.reduce((s, i) => s + Number(i.total), 0);

    // Top customers I served (by # of invoices, last 30d)
    const custCount: Record<string, { name: string; count: number; revenue: number }> = {};
    invoices
      .filter(i => i.created_by === user?.id && differenceInDays(today, new Date(i.created_at)) < 30)
      .forEach(i => {
        const cid = i.customer_id;
        const name = (i as any).customers?.name || "Walk-in";
        if (!custCount[cid]) custCount[cid] = { name, count: 0, revenue: 0 };
        custCount[cid].count += 1;
        custCount[cid].revenue += Number(i.total);
      });
    const topCustomers = Object.values(custCount).sort((a, b) => b.count - a.count).slice(0, 5);

    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold font-heading">Welcome back{displayName ? `, ${displayName.split(" ")[0]}` : ""}</h1>
          <p className="text-muted-foreground text-sm">Here's your day at a glance</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="Today's Revenue" value={`KES ${myTodayRevenue.toLocaleString()}`} sub={`${myToday.length} sales`} color="text-success" />
          <StatCard icon={ShoppingCart} label="Sales Today" value={String(myToday.length)} sub="invoices created" color="text-primary" />
          <StatCard icon={TrendingUp} label="My 7-Day Revenue" value={`KES ${my7dRevenue.toLocaleString()}`} sub={`${myToday7d.length} sales`} color="text-primary" />
          <StatCard icon={Package} label="Low Stock" value={String(lowStockProducts.length)} sub="items need restock" color="text-destructive" />
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">My 7-Day Revenue</CardTitle></CardHeader>
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
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" /> Top Customers (30d)</CardTitle></CardHeader>
            <CardContent>
              {topCustomers.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">No sales in the last 30 days yet.</p>
              ) : (
                <div className="space-y-2">
                  {topCustomers.map((c, i) => (
                    <div key={i} className="flex items-center justify-between py-1.5 border-b last:border-0">
                      <div>
                        <p className="text-sm font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{c.count} sale{c.count !== 1 ? "s" : ""}</p>
                      </div>
                      <p className="text-sm font-semibold">KES {c.revenue.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {lowStockProducts.length > 0 && (
          <Card className="border-destructive/30">
            <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Low Stock Alert</CardTitle></CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {lowStockProducts.map(p => (
                  <Badge key={p.id} variant="destructive" className="text-xs">
                    {p.name}: {p.stock_on_hand} left
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  // ─────────────────── ADMIN VIEW ───────────────────
  const todaySales = invoices.filter(i => i.created_at?.startsWith(todayStr));
  const todayRevenue = todaySales.reduce((s, i) => s + Number(i.paid_amount), 0);
  const totalDebt = invoices.reduce((s, i) => s + Number(i.balance), 0);

  const unpaidInvoices = invoices.filter(i => Number(i.balance) > 0);
  const debt14 = unpaidInvoices.filter(i => differenceInDays(today, new Date(i.created_at)) <= 14).reduce((s, i) => s + Number(i.balance), 0);
  const debt30 = unpaidInvoices.filter(i => { const d = differenceInDays(today, new Date(i.created_at)); return d > 14 && d <= 30; }).reduce((s, i) => s + Number(i.balance), 0);
  const debt60 = unpaidInvoices.filter(i => differenceInDays(today, new Date(i.created_at)) > 30).reduce((s, i) => s + Number(i.balance), 0);

  const totalCOGS = invoices.reduce((s, inv) => s + (inv.invoice_items?.reduce((is, item) => is + Number(item.cogs || 0), 0) || 0), 0);
  const totalRevenue = invoices.reduce((s, i) => s + Number(i.total), 0);
  const totalExp = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const grossProfit = totalRevenue - totalCOGS;
  const netProfit = grossProfit - totalExp;

  const catMap: Record<string, number> = {};
  invoices.forEach(inv => inv.invoice_items?.forEach(item => {
    const prod = products.find(p => p.id === item.product_id);
    const cat = prod?.category || "Other";
    catMap[cat] = (catMap[cat] || 0) + Number(item.total);
  }));
  const categoryData = Object.entries(catMap).map(([name, value]) => ({ name: name.replace(" Services", "").replace(" Accessories", ""), value }));

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

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground mb-1">0-14 Days</p><p className="text-lg font-bold text-success">KES {debt14.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground mb-1">15-30 Days</p><p className="text-lg font-bold text-warning">KES {debt30.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-xs text-muted-foreground mb-1">31-60+ Days</p><p className="text-lg font-bold text-destructive">KES {debt60.toLocaleString()}</p></CardContent></Card>
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

      {lowStockProducts.length > 0 && (
        <Card className="border-destructive/30">
          <CardHeader className="pb-2"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-destructive" /> Low Stock Alert</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowStockProducts.map(p => (
                <Badge key={p.id} variant="destructive" className="text-xs">
                  {p.name}: {p.stock_on_hand} left
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

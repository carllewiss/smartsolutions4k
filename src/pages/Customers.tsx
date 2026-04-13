import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { differenceInDays, parseISO } from "date-fns";

export default function Customers() {
  const { customers, invoices, products } = useStore();
  const today = new Date();

  const getCustomerDebt = (custId: string) => invoices.filter(i => i.customerId === custId && i.balance > 0).reduce((s, i) => s + i.balance, 0);

  const getDebtAging = (custId: string) => {
    const unpaid = invoices.filter(i => i.customerId === custId && i.balance > 0);
    let d14 = 0, d30 = 0, d60 = 0;
    unpaid.forEach(i => {
      const days = differenceInDays(today, parseISO(i.createdAt));
      if (days <= 14) d14 += i.balance;
      else if (days <= 30) d30 += i.balance;
      else d60 += i.balance;
    });
    return { d14, d30, d60 };
  };

  const getTopProducts = (custId: string) => {
    const map: Record<string, number> = {};
    invoices.filter(i => i.customerId === custId).forEach(i => i.items.forEach(item => {
      map[item.productName] = (map[item.productName] || 0) + item.quantity;
    }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-heading">Customers</h1>

      <div className="grid gap-4">
        {customers.filter(c => c.id !== "c1").map(cust => {
          const debt = getCustomerDebt(cust.id);
          const aging = getDebtAging(cust.id);
          const topProds = getTopProducts(cust.id);

          return (
            <Card key={cust.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold font-heading">{cust.name}</h3>
                      {cust.isTaxable && <Badge variant="outline" className="text-xs">Taxable</Badge>}
                      {cust.visitCount >= 3 && <Badge className="bg-primary/10 text-primary text-xs">Repeat</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{cust.phone || "No phone"} {cust.pin ? `· PIN: ${cust.pin}` : ""}</p>
                    <p className="text-xs text-muted-foreground mt-1">{cust.visitCount} visits · KES {cust.totalSpent.toLocaleString()} total spent</p>
                    {topProds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-xs text-muted-foreground">Top:</span>
                        {topProds.map(p => <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>)}
                      </div>
                    )}
                  </div>
                  <div className="text-right space-y-1">
                    {debt > 0 ? (
                      <>
                        <p className="text-sm font-bold text-destructive">Owes: KES {debt.toLocaleString()}</p>
                        <div className="flex gap-2 text-xs justify-end">
                          {aging.d14 > 0 && <span className="text-success">14d: {aging.d14.toLocaleString()}</span>}
                          {aging.d30 > 0 && <span className="text-warning">30d: {aging.d30.toLocaleString()}</span>}
                          {aging.d60 > 0 && <span className="text-destructive">60d+: {aging.d60.toLocaleString()}</span>}
                        </div>
                      </>
                    ) : (
                      <Badge className="bg-success/10 text-success text-xs">No debt</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

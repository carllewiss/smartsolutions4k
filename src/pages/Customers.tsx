import { useCustomers } from "@/hooks/useCustomers";
import { useInvoices } from "@/hooks/useInvoices";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { differenceInDays } from "date-fns";

export default function Customers() {
  const { data: customers = [], isLoading } = useCustomers();
  const { data: invoices = [] } = useInvoices();
  const today = new Date();

  const getDebtAging = (custId: string) => {
    const unpaid = invoices.filter(i => i.customer_id === custId && Number(i.balance) > 0);
    let d14 = 0, d30 = 0, d60 = 0;
    unpaid.forEach(i => {
      const days = differenceInDays(today, new Date(i.created_at));
      if (days <= 14) d14 += Number(i.balance);
      else if (days <= 30) d30 += Number(i.balance);
      else d60 += Number(i.balance);
    });
    return { d14, d30, d60, total: d14 + d30 + d60 };
  };

  const getTopProducts = (custId: string) => {
    const map: Record<string, number> = {};
    invoices.filter(i => i.customer_id === custId).forEach(i => i.invoice_items?.forEach(item => {
      const name = item.product_id; // We'll show product ID for now
      map[name] = (map[name] || 0) + item.quantity;
    }));
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([name]) => name);
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-heading">Customers</h1>

      <div className="grid gap-4">
        {customers.filter(c => c.customer_type !== "walk_in").map(cust => {
          const aging = getDebtAging(cust.id);

          return (
            <Card key={cust.id}>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold font-heading">{cust.name}</h3>
                      <Badge variant="outline" className="text-xs">{cust.customer_code}</Badge>
                      {cust.kra_pin && <Badge variant="outline" className="text-xs">Taxable</Badge>}
                      {cust.visit_count >= 3 && <Badge className="bg-primary/10 text-primary text-xs">Repeat</Badge>}
                    </div>
                    <p className="text-xs text-muted-foreground">{cust.phone || "No phone"} {cust.kra_pin ? `· PIN: ${cust.kra_pin}` : ""}</p>
                    <p className="text-xs text-muted-foreground mt-1">{cust.visit_count} visits · KES {Number(cust.total_spent).toLocaleString()} total spent</p>
                  </div>
                  <div className="text-right space-y-1">
                    {aging.total > 0 ? (
                      <>
                        <p className="text-sm font-bold text-destructive">Owes: KES {aging.total.toLocaleString()}</p>
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
        {customers.filter(c => c.customer_type !== "walk_in").length === 0 && (
          <p className="text-center text-muted-foreground py-8">No customers yet. Create one from the invoice screen.</p>
        )}
      </div>
    </div>
  );
}

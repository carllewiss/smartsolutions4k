import { useStore } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export default function Inventory() {
  const { products, invoices } = useStore();

  const classifyStock = (p: typeof products[0]) => {
    if (p.salesCount > 50) return "Fast Moving";
    if (p.salesCount > 10) return "Regular";
    if (p.salesCount > 0) return "Slow";
    return "Dead Stock";
  };

  const stockBadge = (cls: string) => {
    switch (cls) {
      case "Fast Moving": return "bg-success/10 text-success";
      case "Regular": return "bg-primary/10 text-primary";
      case "Slow": return "bg-warning/10 text-warning";
      default: return "bg-destructive/10 text-destructive";
    }
  };

  // Predictive: avg daily sales * 30
  const predictDaysLeft = (p: typeof products[0]) => {
    if (p.salesCount === 0) return "N/A";
    const avgDaily = p.salesCount / 30; // rough
    if (avgDaily === 0) return "∞";
    const days = Math.round(p.quantity / avgDaily);
    return `~${days}d`;
  };

  const totalValue = products.reduce((s, p) => s + p.quantity * p.buyPrice, 0);
  const totalRetail = products.reduce((s, p) => s + p.quantity * p.sellPrice, 0);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-heading">Inventory</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Items</p><p className="text-xl font-bold">{products.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Stock Value (Cost)</p><p className="text-xl font-bold">KES {totalValue.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Stock Value (Retail)</p><p className="text-xl font-bold">KES {totalRetail.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Low Stock Items</p><p className="text-xl font-bold text-destructive">{products.filter(p => p.quantity <= p.minStock && p.minStock > 0).length}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Product</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Buy</TableHead><TableHead className="text-right">Sell</TableHead><TableHead>Classification</TableHead><TableHead>Stock Level</TableHead><TableHead>Est. Days Left</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {products.map(p => {
                const cls = classifyStock(p);
                const stockPct = p.minStock > 0 ? Math.min(100, (p.quantity / (p.minStock * 3)) * 100) : 100;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-sm">{p.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{p.category}</Badge></TableCell>
                    <TableCell className="text-right text-sm">{p.quantity} {p.unit}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{p.buyPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm">{p.sellPrice.toLocaleString()}</TableCell>
                    <TableCell><Badge className={`text-xs ${stockBadge(cls)}`}>{cls}</Badge></TableCell>
                    <TableCell className="w-32">
                      <Progress value={stockPct} className="h-2" />
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{predictDaysLeft(p)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

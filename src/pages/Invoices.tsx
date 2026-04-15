import { useInvoices } from "@/hooks/useInvoices";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

export default function Invoices() {
  const { data: invoices = [], isLoading } = useInvoices();

  const statusColor = (s: string) => s === "paid" ? "bg-success/10 text-success border-success/20" : s === "partial" ? "bg-warning/10 text-warning border-warning/20" : "bg-destructive/10 text-destructive border-destructive/20";

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-heading">Invoices</h1>
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Invoice #</TableHead><TableHead>Customer</TableHead><TableHead>Date</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Paid</TableHead><TableHead className="text-right">Balance</TableHead><TableHead>Payment</TableHead><TableHead>Status</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {invoices.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium text-sm">{inv.invoice_number}</TableCell>
                  <TableCell className="text-sm">{inv.customer_name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{format(new Date(inv.created_at), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-right text-sm">KES {Number(inv.total).toLocaleString()}</TableCell>
                  <TableCell className="text-right text-sm">KES {Number(inv.paid_amount).toLocaleString()}</TableCell>
                  <TableCell className="text-right text-sm font-medium">{Number(inv.balance) > 0 ? `KES ${Number(inv.balance).toLocaleString()}` : "—"}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs capitalize">{inv.payment_method.replace("_", " ")}</Badge></TableCell>
                  <TableCell><Badge className={`text-xs capitalize ${statusColor(inv.status)}`}>{inv.status}</Badge></TableCell>
                </TableRow>
              ))}
              {invoices.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No invoices yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

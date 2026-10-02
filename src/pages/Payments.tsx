import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { format } from "date-fns";
import { CreditCard } from "lucide-react";

const PAGE = 25;
export const kes = (n: number) => `KES ${Number(n || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function Payments() {
  const [q, setQ] = useState("");
  const [page, setPage] = useState(0);
  const { data = [], isLoading } = useQuery({
    queryKey: ["payments_register"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("payments")
        .select("*, customers(name, customer_code), invoices(invoice_number)")
        .order("payment_date", { ascending: false }).limit(2000);
      if (error) throw error;
      return data as any[];
    },
  });
  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return data.filter((p) => !s || [p.customers?.name, p.invoices?.invoice_number, p.notes, String(p.amount)].some((v) => v?.toLowerCase?.().includes(s)));
  }, [data, q]);
  const pageRows = rows.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold font-heading flex items-center gap-2"><CreditCard className="h-6 w-6" />Payments — Posting & Adjustments</h1>
        <Input placeholder="Search customer, invoice, amount…" value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} className="max-w-xs" />
      </div>
      <Card><CardContent className="p-0">
        <Table>
          <TableHeader><TableRow>
            <TableHead>Date</TableHead><TableHead>Customer</TableHead><TableHead>Invoice</TableHead>
            <TableHead>Method</TableHead><TableHead className="text-right">Amount</TableHead><TableHead>Status</TableHead><TableHead />
          </TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8">Loading…</TableCell></TableRow>}
            {pageRows.map((p) => (
              <TableRow key={p.id}>
                <TableCell>{format(new Date(p.payment_date), "dd MMM yyyy HH:mm")}</TableCell>
                <TableCell>{p.customers?.name}</TableCell>
                <TableCell>{p.invoices?.invoice_number}</TableCell>
                <TableCell>{Number(p.mpesa_amount) > 0 && Number(p.cash_amount) > 0 ? "Cash + M-Pesa" : Number(p.mpesa_amount) > 0 ? "M-Pesa" : "Cash"}</TableCell>
                <TableCell className="text-right font-medium">{kes(p.amount)}</TableCell>
                <TableCell><Badge variant={p.status === "reversed" ? "destructive" : "secondary"}>{p.status?.toUpperCase()}</Badge></TableCell>
                <TableCell><Button asChild size="sm" variant="ghost"><Link to={`/payments/${p.id}`}>Open</Link></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
      <div className="flex items-center justify-end gap-2 text-sm">
        <span className="text-muted-foreground">{rows.length} payments</span>
        <Button size="sm" variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>Prev</Button>
        <Button size="sm" variant="outline" disabled={(page + 1) * PAGE >= rows.length} onClick={() => setPage(page + 1)}>Next</Button>
      </div>
    </div>
  );
}

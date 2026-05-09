import { useState } from "react";
import { Link } from "react-router-dom";
import { usePurchases, usePostPurchase } from "@/hooks/usePurchases";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus, FileText, FileBox, Calendar } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { MonthlyReceiptsDialog } from "@/components/MonthlyReceiptsDialog";

export default function PurchaseInvoices() {
  const [tab, setTab] = useState("all");
  const { data: purchases = [], isLoading } = usePurchases(tab === "all" ? undefined : tab);
  const post = usePostPurchase();
  const [monthlyOpen, setMonthlyOpen] = useState(false);

  const onPost = async (id: string) => {
    try { await post.mutateAsync(id); toast.success("Invoice posted — stock updated, GL entries created"); }
    catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold font-heading">Purchase Invoices</h1>
          <p className="text-sm text-muted-foreground">Supplier bills, drafts, and posted invoices</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setMonthlyOpen(true)}>
            <Calendar className="h-4 w-4 mr-1" /> Monthly Receipts PDF
          </Button>
          <Link to="/purchases/orders">
            <Button variant="outline"><FileBox className="h-4 w-4 mr-1" /> Purchase Orders</Button>
          </Link>
          <Link to="/purchases/new">
            <Button><Plus className="h-4 w-4 mr-1" /> New Purchase Invoice</Button>
          </Link>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="draft">Drafts</TabsTrigger>
          <TabsTrigger value="posted">Posted</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4">
          <Card>
            <CardContent className="p-0">
              {isLoading ? <p className="p-8 text-center text-muted-foreground">Loading...</p> : (
              <Table>
                <TableHeader><TableRow>
                  <TableHead>Invoice #</TableHead><TableHead>Date</TableHead><TableHead>Supplier</TableHead>
                  <TableHead>Status</TableHead><TableHead>Pay Mode</TableHead>
                  <TableHead className="text-right">VAT</TableHead><TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {purchases.map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-mono text-xs">{p.invoice_number || p.purchase_code}</TableCell>
                      <TableCell className="text-sm">{format(new Date(p.invoice_date || p.purchase_date), "dd MMM yyyy")}</TableCell>
                      <TableCell className="text-sm">{p.suppliers?.name}</TableCell>
                      <TableCell>
                        <Badge variant={p.status === "posted" ? "default" : p.status === "cancelled" ? "destructive" : "secondary"}>{p.status}</Badge>
                      </TableCell>
                      <TableCell className="text-xs uppercase">{p.payment_mode}</TableCell>
                      <TableCell className="text-right text-sm">{Number(p.vat_total || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-right font-medium">KES {Number(p.total).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <Link to={`/purchases/${p.id}`}>
                            <Button size="sm" variant="ghost"><FileText className="h-3.5 w-3.5" /></Button>
                          </Link>
                          {p.status === "draft" && (
                            <Button size="sm" onClick={() => onPost(p.id)} disabled={post.isPending}>Post</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {purchases.length === 0 && <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">No purchase invoices.</TableCell></TableRow>}
                </TableBody>
              </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <MonthlyReceiptsDialog open={monthlyOpen} onOpenChange={setMonthlyOpen} />
    </div>
  );
}

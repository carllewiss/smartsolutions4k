import { useState } from "react";
import { useStore, type Purchase } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";

export default function Purchases() {
  const store = useStore();
  const [open, setOpen] = useState(false);
  const [supplierId, setSupplierId] = useState(store.suppliers[0]?.id || "");
  const [productId, setProductId] = useState(store.products[0]?.id || "");
  const [qty, setQty] = useState(1);
  const [unitCost, setUnitCost] = useState(0);

  const submit = () => {
    const prod = store.products.find(p => p.id === productId);
    const sup = store.suppliers.find(s => s.id === supplierId);
    if (!prod || !sup) return;

    const pu: Purchase = {
      id: `pu${Date.now()}`,
      supplierId,
      supplierName: sup.name,
      items: [{ productId, productName: prod.name, quantity: qty, unitCost, total: qty * unitCost }],
      total: qty * unitCost,
      date: new Date().toISOString().split("T")[0],
    };
    store.addPurchase(pu);
    toast.success("Purchase recorded! Inventory updated.");
    setOpen(false);
    setQty(1);
    setUnitCost(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Purchases</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New Purchase</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Purchase</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Supplier</Label>
                <Select value={supplierId} onValueChange={setSupplierId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{store.suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Product</Label>
                <Select value={productId} onValueChange={setProductId}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{store.products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Quantity</Label><Input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} /></div>
                <div><Label>Unit Cost (KES)</Label><Input type="number" value={unitCost} onChange={e => setUnitCost(Number(e.target.value))} /></div>
              </div>
              <p className="text-sm font-medium">Total: KES {(qty * unitCost).toLocaleString()}</p>
              <Button className="w-full" onClick={submit}>Record Purchase</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Date</TableHead><TableHead>Supplier</TableHead><TableHead>Product</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Unit Cost</TableHead><TableHead className="text-right">Total</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {store.purchases.map(pu => (
                <TableRow key={pu.id}>
                  <TableCell className="text-sm">{format(parseISO(pu.date), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-sm">{pu.supplierName}</TableCell>
                  <TableCell className="text-sm">{pu.items.map(i => i.productName).join(", ")}</TableCell>
                  <TableCell className="text-right text-sm">{pu.items.reduce((s, i) => s + i.quantity, 0)}</TableCell>
                  <TableCell className="text-right text-sm">{pu.items[0]?.unitCost.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium text-sm">KES {pu.total.toLocaleString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

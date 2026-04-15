import { useState } from "react";
import { usePurchases, useCreatePurchase } from "@/hooks/usePurchases";
import { useSuppliers, useCreateSupplier } from "@/hooks/useSuppliers";
import { useProducts } from "@/hooks/useProducts";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export default function Purchases() {
  const { data: purchases = [], isLoading } = usePurchases();
  const { data: suppliers = [] } = useSuppliers();
  const { data: products = [] } = useProducts();
  const createPurchase = useCreatePurchase();
  const createSupplier = useCreateSupplier();

  const [open, setOpen] = useState(false);
  const [supOpen, setSupOpen] = useState(false);
  const [supplierId, setSupplierId] = useState("");
  const [productId, setProductId] = useState("");
  const [qty, setQty] = useState(1);
  const [unitCost, setUnitCost] = useState(0);
  const [newSupName, setNewSupName] = useState("");
  const [newSupPhone, setNewSupPhone] = useState("");
  const [newSupPin, setNewSupPin] = useState("");

  const submitPurchase = async () => {
    if (!supplierId || !productId || qty <= 0 || unitCost <= 0) { toast.error("Fill all fields"); return; }
    try {
      await createPurchase.mutateAsync({
        supplier_id: supplierId,
        purchase_date: new Date().toISOString().split("T")[0],
        items: [{ product_id: productId, quantity: qty, unit_cost: unitCost }],
      });
      toast.success("Purchase recorded! Stock batch created.");
      setOpen(false);
      setQty(1);
      setUnitCost(0);
    } catch (e: any) { toast.error(e.message); }
  };

  const submitSupplier = async () => {
    if (!newSupName.trim()) { toast.error("Enter supplier name"); return; }
    try {
      const s = await createSupplier.mutateAsync({ name: newSupName, phone: newSupPhone || undefined, kra_pin: newSupPin || undefined });
      setSupplierId(s.id);
      toast.success("Supplier added!");
      setSupOpen(false);
      setNewSupName("");
    } catch (e: any) { toast.error(e.message); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Purchases</h1>
        <div className="flex gap-2">
          <Dialog open={supOpen} onOpenChange={setSupOpen}>
            <DialogTrigger asChild><Button variant="outline"><Plus className="h-4 w-4 mr-1" /> Supplier</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label><Input value={newSupName} onChange={e => setNewSupName(e.target.value)} /></div>
                <div><Label>Phone</Label><Input value={newSupPhone} onChange={e => setNewSupPhone(e.target.value)} /></div>
                <div><Label>KRA PIN</Label><Input value={newSupPin} onChange={e => setNewSupPin(e.target.value)} /></div>
                <Button className="w-full" onClick={submitSupplier}>Add Supplier</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> New Purchase</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Record Purchase</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Supplier</Label>
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>{suppliers.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Product</Label>
                  <Select value={productId} onValueChange={setProductId}>
                    <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                    <SelectContent>{products.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Quantity</Label><Input type="number" min={1} value={qty} onChange={e => setQty(Number(e.target.value))} /></div>
                  <div><Label>Unit Cost (KES)</Label><Input type="number" value={unitCost} onChange={e => setUnitCost(Number(e.target.value))} /></div>
                </div>
                <p className="text-sm font-medium">Total: KES {(qty * unitCost).toLocaleString()}</p>
                <Button className="w-full" onClick={submitPurchase} disabled={createPurchase.isPending}>
                  {createPurchase.isPending ? "Recording..." : "Record Purchase"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Code</TableHead><TableHead>Date</TableHead><TableHead>Supplier</TableHead><TableHead>Product</TableHead><TableHead className="text-right">Qty</TableHead><TableHead className="text-right">Unit Cost</TableHead><TableHead className="text-right">Total</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {purchases.map(pu => (
                <TableRow key={pu.id}>
                  <TableCell className="font-medium text-sm">{pu.purchase_code}</TableCell>
                  <TableCell className="text-sm">{format(new Date(pu.purchase_date), "dd MMM yyyy")}</TableCell>
                  <TableCell className="text-sm">{(pu.suppliers as any)?.name}</TableCell>
                  <TableCell className="text-sm">{(pu.purchase_items as any[])?.map((i: any) => (i.products as any)?.name).join(", ")}</TableCell>
                  <TableCell className="text-right text-sm">{(pu.purchase_items as any[])?.reduce((s: number, i: any) => s + i.quantity, 0)}</TableCell>
                  <TableCell className="text-right text-sm">{(pu.purchase_items as any[])?.[0]?.unit_cost?.toLocaleString()}</TableCell>
                  <TableCell className="text-right font-medium text-sm">KES {Number(pu.total).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {purchases.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No purchases yet</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

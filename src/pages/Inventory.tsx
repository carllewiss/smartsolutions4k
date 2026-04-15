import { useState } from "react";
import { useProductWithStock } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { useCreateProduct } from "@/hooks/useProducts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus } from "lucide-react";
import { toast } from "sonner";

export default function Inventory() {
  const { data: products = [], isLoading } = useProductWithStock();
  const createProduct = useCreateProduct();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<"Phone Accessories" | "Internet Services" | "Printing Services" | "Other Services">("Phone Accessories");
  const [sellPrice, setSellPrice] = useState(0);
  const [floorPrice, setFloorPrice] = useState(0);
  const [unit, setUnit] = useState("pcs");
  const [minStock, setMinStock] = useState(0);
  const [isService, setIsService] = useState(false);

  const classifyStock = (stock: number, minStk: number) => {
    if (stock === 0) return "Dead Stock";
    if (stock <= minStk) return "Low";
    if (stock <= minStk * 2) return "Regular";
    return "Fast Moving";
  };

  const stockBadge = (cls: string) => {
    switch (cls) {
      case "Fast Moving": return "bg-success/10 text-success";
      case "Regular": return "bg-primary/10 text-primary";
      case "Low": return "bg-warning/10 text-warning";
      default: return "bg-destructive/10 text-destructive";
    }
  };

  const totalValue = products.reduce((s, p) => s + p.stock_on_hand * Number(p.base_sell_price), 0);
  const lowStockCount = products.filter(p => p.stock_on_hand <= p.min_stock && p.min_stock > 0).length;

  const addProduct = async () => {
    if (!name.trim()) { toast.error("Enter product name"); return; }
    try {
      await createProduct.mutateAsync({ name, category, base_sell_price: sellPrice, floor_price: floorPrice, unit, min_stock: minStock, is_service: isService });
      toast.success("Product added!");
      setOpen(false);
      setName("");
      setSellPrice(0);
      setFloorPrice(0);
    } catch (e: any) { toast.error(e.message); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Inventory</h1>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Add Product</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Product / Service</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
              <div><Label>Category</Label>
                <Select value={category} onValueChange={v => setCategory(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Phone Accessories">Phone Accessories</SelectItem>
                    <SelectItem value="Internet Services">Internet Services</SelectItem>
                    <SelectItem value="Printing Services">Printing Services</SelectItem>
                    <SelectItem value="Other Services">Other Services</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Sell Price (KES)</Label><Input type="number" value={sellPrice} onChange={e => setSellPrice(Number(e.target.value))} /></div>
                <div><Label>Floor Price (KES)</Label><Input type="number" value={floorPrice} onChange={e => setFloorPrice(Number(e.target.value))} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Unit</Label><Input value={unit} onChange={e => setUnit(e.target.value)} /></div>
                <div><Label>Min Stock</Label><Input type="number" value={minStock} onChange={e => setMinStock(Number(e.target.value))} /></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={isService} onCheckedChange={setIsService} />
                <Label className="text-xs">This is a service (no stock tracking)</Label>
              </div>
              <Button className="w-full" onClick={addProduct} disabled={createProduct.isPending}>
                {createProduct.isPending ? "Adding..." : "Add Product"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Total Items</p><p className="text-xl font-bold">{products.length}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Stock Value (Retail)</p><p className="text-xl font-bold">KES {totalValue.toLocaleString()}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Low Stock Items</p><p className="text-xl font-bold text-destructive">{lowStockCount}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs text-muted-foreground">Services</p><p className="text-xl font-bold">{products.filter(p => p.is_service).length}</p></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow>
              <TableHead>Product</TableHead><TableHead>Category</TableHead><TableHead className="text-right">Stock</TableHead><TableHead className="text-right">Sell Price</TableHead><TableHead className="text-right">Floor</TableHead><TableHead>Status</TableHead><TableHead>Level</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {products.map(p => {
                const cls = p.is_service ? "Service" : classifyStock(p.stock_on_hand, p.min_stock);
                const stockPct = p.min_stock > 0 ? Math.min(100, (p.stock_on_hand / (p.min_stock * 3)) * 100) : 100;
                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium text-sm">{p.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{p.category}</Badge></TableCell>
                    <TableCell className="text-right text-sm">{p.is_service ? "∞" : `${p.stock_on_hand} ${p.unit}`}</TableCell>
                    <TableCell className="text-right text-sm">{Number(p.base_sell_price).toLocaleString()}</TableCell>
                    <TableCell className="text-right text-sm text-muted-foreground">{Number(p.floor_price).toLocaleString()}</TableCell>
                    <TableCell><Badge className={`text-xs ${stockBadge(cls)}`}>{cls}</Badge></TableCell>
                    <TableCell className="w-32">{!p.is_service && <Progress value={stockPct} className="h-2" />}</TableCell>
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

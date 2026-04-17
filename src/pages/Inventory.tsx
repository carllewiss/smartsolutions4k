import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProductWithStock, useDeleteProduct } from "@/hooks/useProducts";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Plus, Edit3, Trash2, ChevronRight } from "lucide-react";
import { ProductFormDialog } from "@/components/ProductFormDialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

export default function Inventory() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { data: products = [], isLoading } = useProductWithStock();
  const del = useDeleteProduct();
  const [open, setOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<any>(null);

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
      case "Service": return "bg-accent/20 text-primary";
      default: return "bg-destructive/10 text-destructive";
    }
  };

  const totalValue = products.reduce((s, p) => s + p.stock_on_hand * Number(p.base_sell_price), 0);
  const lowStockCount = products.filter(p => p.stock_on_hand <= p.min_stock && p.min_stock > 0).length;

  const handleDelete = async (id: string) => {
    try {
      await del.mutateAsync(id);
      toast.success("Product deleted");
    } catch (e: any) { toast.error(e.message); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading">Inventory</h1>
        {isAdmin && (
          <Button onClick={() => { setEditProduct(null); setOpen(true); }}>
            <Plus className="h-4 w-4 mr-1" /> Add Product
          </Button>
        )}
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
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Tax</TableHead>
                <TableHead className="text-right">Stock</TableHead>
                <TableHead className="text-right">Sell Price</TableHead>
                {isAdmin && <TableHead className="text-right">Floor</TableHead>}
                <TableHead>Status</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="text-right w-32">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map(p => {
                const cls = p.is_service ? "Service" : classifyStock(p.stock_on_hand, p.min_stock);
                const stockPct = p.min_stock > 0 ? Math.min(100, (p.stock_on_hand / (p.min_stock * 3)) * 100) : 100;
                return (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => navigate(`/inventory/${p.id}`)}>
                    <TableCell className="font-medium text-sm">{p.name}</TableCell>
                    <TableCell><Badge variant="outline" className="text-xs">{p.category}</Badge></TableCell>
                    <TableCell><Badge variant="outline" className="text-xs capitalize">{((p as any).tax_category || "standard").replace("_", "-")}</Badge></TableCell>
                    <TableCell className="text-right text-sm">{p.is_service ? "∞" : `${p.stock_on_hand} ${p.unit}`}</TableCell>
                    <TableCell className="text-right text-sm">{Number(p.base_sell_price).toLocaleString()}</TableCell>
                    {isAdmin && <TableCell className="text-right text-sm text-muted-foreground">{Number(p.floor_price).toLocaleString()}</TableCell>}
                    <TableCell><Badge className={`text-xs ${stockBadge(cls)}`}>{cls}</Badge></TableCell>
                    <TableCell className="w-32">{!p.is_service && <Progress value={stockPct} className="h-2" />}</TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        {isAdmin && (
                          <>
                            <Button size="icon" variant="ghost" onClick={() => { setEditProduct(p); setOpen(true); }}>
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete {p.name}?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    This is permanent. Blocked if the product has any sales history or stock batches.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDelete(p.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ProductFormDialog open={open} onOpenChange={setOpen} product={editProduct} />
    </div>
  );
}

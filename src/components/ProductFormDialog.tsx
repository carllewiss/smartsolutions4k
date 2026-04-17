import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import { toast } from "sonner";

type Category = "Phone Accessories" | "Internet Services" | "Printing Services" | "Other Services";
type Tax = "standard" | "zero_rated" | "exempt";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  product?: {
    id: string;
    name: string;
    category: string;
    base_sell_price: number;
    floor_price: number;
    unit: string;
    min_stock: number;
    is_service: boolean;
    tax_category: string;
  } | null;
}

export function ProductFormDialog({ open, onOpenChange, product }: Props) {
  const isEdit = !!product;
  const create = useCreateProduct();
  const update = useUpdateProduct();

  const [name, setName] = useState("");
  const [category, setCategory] = useState<Category>("Phone Accessories");
  const [sellPrice, setSellPrice] = useState(0);
  const [floorPrice, setFloorPrice] = useState(0);
  const [unit, setUnit] = useState("pcs");
  const [minStock, setMinStock] = useState(0);
  const [isService, setIsService] = useState(false);
  const [taxCategory, setTaxCategory] = useState<Tax>("standard");

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category as Category);
      setSellPrice(Number(product.base_sell_price));
      setFloorPrice(Number(product.floor_price));
      setUnit(product.unit);
      setMinStock(product.min_stock);
      setIsService(product.is_service);
      setTaxCategory((product.tax_category as Tax) || "standard");
    } else {
      setName(""); setCategory("Phone Accessories"); setSellPrice(0); setFloorPrice(0);
      setUnit("pcs"); setMinStock(0); setIsService(false); setTaxCategory("standard");
    }
  }, [product, open]);

  const submit = async () => {
    if (!name.trim()) { toast.error("Enter product name"); return; }
    try {
      if (isEdit && product) {
        await update.mutateAsync({
          id: product.id, name, category, base_sell_price: sellPrice, floor_price: floorPrice,
          unit, min_stock: minStock, is_service: isService, tax_category: taxCategory,
        });
        toast.success("Product updated");
      } else {
        await create.mutateAsync({
          name, category, base_sell_price: sellPrice, floor_price: floorPrice,
          unit, min_stock: minStock, is_service: isService, tax_category: taxCategory,
        });
        toast.success("Product added");
      }
      onOpenChange(false);
    } catch (e: any) { toast.error(e.message); }
  };

  const pending = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{isEdit ? "Edit Product" : "Add Product / Service"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
          <div>
            <Label>Category</Label>
            <Select value={category} onValueChange={v => setCategory(v as Category)}>
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
          <div>
            <Label>Tax Category</Label>
            <Select value={taxCategory} onValueChange={v => setTaxCategory(v as Tax)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (16% VAT)</SelectItem>
                <SelectItem value="zero_rated">Zero-Rated (0%)</SelectItem>
                <SelectItem value="exempt">Exempt (0%)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={isService} onCheckedChange={setIsService} />
            <Label className="text-xs">This is a service (no stock tracking)</Label>
          </div>
          <Button className="w-full" onClick={submit} disabled={pending}>
            {pending ? "Saving..." : isEdit ? "Save changes" : "Add Product"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

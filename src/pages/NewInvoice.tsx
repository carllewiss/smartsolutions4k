import { useState } from "react";
import { useStore, type Invoice, type InvoiceItem, type PaymentMethod, type Customer } from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Printer } from "lucide-react";
import { toast } from "sonner";

export default function NewInvoice() {
  const store = useStore();
  const [selectedCustomerId, setSelectedCustomerId] = useState("c1");
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [isTaxable, setIsTaxable] = useState(false);
  const [custPin, setCustPin] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [cashAmount, setCashAmount] = useState(0);
  const [mpesaAmount, setMpesaAmount] = useState(0);

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const tax = isTaxable ? subtotal * 0.16 : 0;
  const total = subtotal + tax;

  const paidAmount = paymentMethod === "cash" ? cashAmount
    : paymentMethod === "mpesa" ? mpesaAmount
    : paymentMethod === "cash_mpesa" ? cashAmount + mpesaAmount
    : cashAmount + mpesaAmount;
  const balance = Math.max(0, total - paidAmount);

  const addItem = (productId: string) => {
    const prod = store.products.find(p => p.id === productId);
    if (!prod) return;
    if (items.find(i => i.productId === productId)) {
      setItems(items.map(i => i.productId === productId ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice } : i));
    } else {
      setItems([...items, { productId: prod.id, productName: prod.name, quantity: 1, unitPrice: prod.sellPrice, total: prod.sellPrice }]);
    }
  };

  const updateItemQty = (productId: string, qty: number) => {
    if (qty <= 0) {
      setItems(items.filter(i => i.productId !== productId));
    } else {
      setItems(items.map(i => i.productId === productId ? { ...i, quantity: qty, total: qty * i.unitPrice } : i));
    }
  };

  const removeItem = (productId: string) => setItems(items.filter(i => i.productId !== productId));

  const submitInvoice = () => {
    if (items.length === 0) { toast.error("Add at least one item"); return; }
    if (paymentMethod !== "partial_debt" && balance > 0) { toast.error("Amount doesn't cover total. Use 'Pay Later (Debt)' option."); return; }

    let customerId = selectedCustomerId;
    let customerName = store.customers.find(c => c.id === customerId)?.name || "Walking Customer";

    if (isNewCustomer) {
      if (!newCustName.trim()) { toast.error("Enter customer name"); return; }
      const id = `c${Date.now()}`;
      store.addCustomer({ id, name: newCustName, phone: newCustPhone, isTaxable, pin: custPin || undefined, totalSpent: 0, visitCount: 0, createdAt: new Date().toISOString().split("T")[0] });
      customerId = id;
      customerName = newCustName;
    }

    const inv: Invoice = {
      id: `inv${Date.now()}`,
      invoiceNumber: store.getNextInvoiceNumber(),
      customerId,
      customerName,
      items,
      subtotal,
      tax,
      total,
      paidAmount: Math.min(paidAmount, total),
      balance,
      paymentMethod,
      cashAmount: paymentMethod === "mpesa" ? 0 : cashAmount,
      mpesaAmount: paymentMethod === "cash" ? 0 : mpesaAmount,
      status: balance === 0 ? "paid" : paidAmount > 0 ? "partial" : "unpaid",
      createdAt: new Date().toISOString(),
    };

    store.addInvoice(inv);
    toast.success(`Invoice ${inv.invoiceNumber} created!`);
    setItems([]);
    setCashAmount(0);
    setMpesaAmount(0);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-heading">New Invoice</h1>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Product selection */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Add Products / Services</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {store.products.map(p => (
                  <Button key={p.id} variant="outline" className="h-auto py-3 px-3 flex flex-col items-start text-left" onClick={() => addItem(p.id)}>
                    <span className="text-xs font-medium truncate w-full">{p.name}</span>
                    <span className="text-xs text-muted-foreground">KES {p.sellPrice} · {p.quantity} in stock</span>
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {items.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-base">Invoice Items</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Item</TableHead><TableHead className="w-20">Qty</TableHead><TableHead className="text-right">Price</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="w-10"></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {items.map(item => (
                      <TableRow key={item.productId}>
                        <TableCell className="text-sm">{item.productName}</TableCell>
                        <TableCell><Input type="number" min={1} value={item.quantity} onChange={e => updateItemQty(item.productId, parseInt(e.target.value) || 0)} className="h-8 w-16" /></TableCell>
                        <TableCell className="text-right text-sm">{item.unitPrice.toLocaleString()}</TableCell>
                        <TableCell className="text-right font-medium text-sm">{item.total.toLocaleString()}</TableCell>
                        <TableCell><Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeItem(item.productId)}><Trash2 className="h-3 w-3" /></Button></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right: Customer & Payment */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Customer</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <Switch checked={isNewCustomer} onCheckedChange={setIsNewCustomer} />
                <Label className="text-xs">New customer</Label>
              </div>
              {isNewCustomer ? (
                <>
                  <Input placeholder="Customer name" value={newCustName} onChange={e => setNewCustName(e.target.value)} />
                  <Input placeholder="Phone (optional)" value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} />
                  <div className="flex items-center gap-2">
                    <Switch checked={isTaxable} onCheckedChange={setIsTaxable} />
                    <Label className="text-xs">Taxable (VAT 16%)</Label>
                  </div>
                  {isTaxable && <Input placeholder="KRA PIN" value={custPin} onChange={e => setCustPin(e.target.value)} />}
                </>
              ) : (
                <Select value={selectedCustomerId} onValueChange={v => {
                  setSelectedCustomerId(v);
                  const c = store.customers.find(c => c.id === v);
                  setIsTaxable(c?.isTaxable || false);
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {store.customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-base">Payment</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>KES {subtotal.toLocaleString()}</span></div>
                {isTaxable && <div className="flex justify-between"><span className="text-muted-foreground">VAT (16%)</span><span>KES {tax.toLocaleString()}</span></div>}
                <div className="flex justify-between font-bold text-base border-t pt-2"><span>Total</span><span>KES {total.toLocaleString()}</span></div>
              </div>

              <Select value={paymentMethod} onValueChange={v => setPaymentMethod(v as PaymentMethod)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="mpesa">M-Pesa</SelectItem>
                  <SelectItem value="cash_mpesa">Cash + M-Pesa</SelectItem>
                  <SelectItem value="partial_debt">Pay Later (Debt)</SelectItem>
                </SelectContent>
              </Select>

              {(paymentMethod === "cash" || paymentMethod === "cash_mpesa" || paymentMethod === "partial_debt") && (
                <div>
                  <Label className="text-xs">Cash Amount</Label>
                  <Input type="number" value={cashAmount} onChange={e => setCashAmount(Number(e.target.value))} />
                </div>
              )}
              {(paymentMethod === "mpesa" || paymentMethod === "cash_mpesa" || paymentMethod === "partial_debt") && (
                <div>
                  <Label className="text-xs">M-Pesa Amount</Label>
                  <Input type="number" value={mpesaAmount} onChange={e => setMpesaAmount(Number(e.target.value))} />
                </div>
              )}

              {balance > 0 && (
                <div className="bg-warning/10 border border-warning/30 rounded-md p-2 text-center">
                  <p className="text-xs text-warning font-medium">Balance: KES {balance.toLocaleString()}</p>
                </div>
              )}

              <Button className="w-full" onClick={submitInvoice} disabled={items.length === 0}>
                Create Invoice
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

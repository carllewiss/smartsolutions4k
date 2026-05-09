import { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { useSuppliers, useCreateSupplier } from "@/hooks/useSuppliers";
import { useSavePurchase, usePurchase, usePostPurchase } from "@/hooks/usePurchases";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Trash2, Plus, FileText, Save, Send } from "lucide-react";
import { PurchaseProductPicker } from "@/components/PurchaseProductPicker";
import { PurchaseReceiptsUpload } from "@/components/PurchaseReceiptsUpload";
import { format, addDays } from "date-fns";
import { toast } from "sonner";

type Line = { product_id: string; product_name: string; description: string; quantity: number; unit_cost: number; vat_rate: number };

const emptyLine = (): Line => ({ product_id: "", product_name: "", description: "", quantity: 1, unit_cost: 0, vat_rate: 16 });

export default function NewPurchaseInvoice() {
  const { id } = useParams();
  const nav = useNavigate();
  const { data: suppliers = [] } = useSuppliers();
  const createSupplier = useCreateSupplier();
  const savePurchase = useSavePurchase();
  const postPurchase = usePostPurchase();
  const { data: existing } = usePurchase(id);

  const [supplierId, setSupplierId] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [paymentTerms, setPaymentTerms] = useState(30);
  const [paymentMode, setPaymentMode] = useState<"credit" | "cash" | "mpesa" | "bank">("credit");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [withholdTax, setWithholdTax] = useState(false);
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [supOpen, setSupOpen] = useState(false);
  const [newSup, setNewSup] = useState({ name: "", phone: "", kra_pin: "" });
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    if (existing) {
      setSupplierId(existing.supplier_id);
      setInvoiceNumber(existing.invoice_number || "");
      setInvoiceDate(existing.invoice_date || existing.purchase_date);
      setPaymentTerms(existing.payment_terms_days ?? 30);
      setPaymentMode(existing.payment_mode || "credit");
      setReference(existing.reference || "");
      setNotes(existing.notes || "");
      setWithholdTax(Number(existing.wht_total || 0) > 0);
      setLines((existing.purchase_items || []).map((it: any) => ({
        product_id: it.product_id, product_name: it.products?.name || "", description: it.description || "",
        quantity: it.quantity, unit_cost: Number(it.unit_cost), vat_rate: Number(it.vat_rate || 0),
      })));
      setSavedId(existing.id);
    }
  }, [existing]);

  const dueDate = useMemo(() => format(addDays(new Date(invoiceDate), paymentTerms || 0), "yyyy-MM-dd"), [invoiceDate, paymentTerms]);

  const totals = useMemo(() => {
    let subtotal = 0, vat = 0;
    for (const l of lines) {
      const net = l.quantity * l.unit_cost;
      subtotal += net;
      vat += net * (l.vat_rate || 0) / 100;
    }
    const grossBeforeWht = subtotal + vat;
    const wht = withholdTax ? subtotal * 0.02 : 0;
    return { subtotal, vat, wht, total: grossBeforeWht - wht, payable: grossBeforeWht - wht };
  }, [lines, withholdTax]);

  const supplier = suppliers.find((s: any) => s.id === supplierId);

  const updateLine = (i: number, patch: Partial<Line>) => setLines(prev => prev.map((l, idx) => idx === i ? { ...l, ...patch } : l));
  const removeLine = (i: number) => setLines(prev => prev.filter((_, idx) => idx !== i));
  const addLine = () => setLines(prev => [...prev, emptyLine()]);

  const validLines = lines.filter(l => l.product_id && l.quantity > 0 && l.unit_cost >= 0);

  const save = async (alsoPost = false) => {
    if (!supplierId) { toast.error("Pick a supplier"); return; }
    if (!validLines.length) { toast.error("Add at least one line"); return; }
    try {
      const newId = await savePurchase.mutateAsync({
        id: savedId || id,
        supplier_id: supplierId, invoice_number: invoiceNumber || undefined,
        invoice_date: invoiceDate, due_date: dueDate, payment_terms_days: paymentTerms,
        payment_mode: paymentMode, reference, notes,
        wht_total: totals.wht,
        items: validLines.map(l => ({
          product_id: l.product_id, description: l.description, quantity: l.quantity,
          unit_cost: l.unit_cost, vat_rate: l.vat_rate,
        })),
      });
      setSavedId(newId);
      toast.success("Saved as draft");
      if (alsoPost) {
        await postPurchase.mutateAsync(newId);
        toast.success("Posted! Stock updated.");
        nav("/purchases");
      }
    } catch (e: any) { toast.error(e.message); }
  };

  const submitSupplier = async () => {
    if (!newSup.name.trim()) return toast.error("Supplier name required");
    try {
      const s = await createSupplier.mutateAsync({ name: newSup.name, phone: newSup.phone || undefined, kra_pin: newSup.kra_pin || undefined });
      setSupplierId(s.id); setSupOpen(false); setNewSup({ name: "", phone: "", kra_pin: "" });
      toast.success("Supplier added");
    } catch (e: any) { toast.error(e.message); }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <Link to="/purchases" className="text-xs text-muted-foreground hover:underline">Purchases / Purchase Invoices</Link>
          <h1 className="text-2xl font-bold font-heading">{savedId ? "Edit" : "Create"} Purchase Invoice</h1>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => nav("/purchases")}>Cancel</Button>
          <Button variant="outline" onClick={() => save(false)} disabled={savePurchase.isPending}>
            <Save className="h-4 w-4 mr-1" /> Save Draft
          </Button>
          <Button onClick={() => save(true)} disabled={savePurchase.isPending || postPurchase.isPending}>
            <Send className="h-4 w-4 mr-1" /> Post Invoice
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        <div className="space-y-4">
          {/* Header card */}
          <Card>
            <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2">
                <Label>Supplier *</Label>
                <div className="flex gap-2">
                  <Select value={supplierId} onValueChange={setSupplierId}>
                    <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                    <SelectContent>{suppliers.map((s: any) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Dialog open={supOpen} onOpenChange={setSupOpen}>
                    <DialogTrigger asChild><Button variant="outline" size="icon"><Plus className="h-4 w-4" /></Button></DialogTrigger>
                    <DialogContent>
                      <DialogHeader><DialogTitle>Add Supplier</DialogTitle></DialogHeader>
                      <div className="space-y-3">
                        <div><Label>Name *</Label><Input value={newSup.name} onChange={e => setNewSup({ ...newSup, name: e.target.value })} /></div>
                        <div><Label>Phone</Label><Input value={newSup.phone} onChange={e => setNewSup({ ...newSup, phone: e.target.value })} /></div>
                        <div><Label>KRA PIN</Label><Input value={newSup.kra_pin} onChange={e => setNewSup({ ...newSup, kra_pin: e.target.value })} /></div>
                        <Button className="w-full" onClick={submitSupplier}>Add</Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div>
                <Label>Invoice # (supplier's)</Label>
                <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="auto" />
              </div>
              <div>
                <Label>Invoice Date *</Label>
                <Input type="date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
              </div>
              <div>
                <Label>Payment Mode</Label>
                <Select value={paymentMode} onValueChange={(v) => setPaymentMode(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit">Credit (Add to Payables)</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="mpesa">M-Pesa</SelectItem>
                    <SelectItem value="bank">Bank</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment Terms (days)</Label>
                <Input type="number" value={paymentTerms} onChange={e => setPaymentTerms(Number(e.target.value))} />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input type="date" value={dueDate} disabled />
              </div>
              <div>
                <Label>Reference (GRN / Delivery Note)</Label>
                <Input value={reference} onChange={e => setReference(e.target.value)} placeholder="Optional" />
              </div>
            </CardContent>
          </Card>

          {/* Line items */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base">Line Items</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-xs uppercase tracking-wider">
                    <tr>
                      <th className="p-2 text-left w-8">#</th>
                      <th className="p-2 text-left min-w-[180px]">Product</th>
                      <th className="p-2 text-left">Description</th>
                      <th className="p-2 text-right w-20">Qty</th>
                      <th className="p-2 text-right w-28">Unit Cost</th>
                      <th className="p-2 text-right w-20">VAT %</th>
                      <th className="p-2 text-right w-28">Line Total</th>
                      <th className="p-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l, i) => {
                      const net = l.quantity * l.unit_cost;
                      const vat = net * (l.vat_rate || 0) / 100;
                      return (
                        <tr key={i} className="border-t align-top">
                          <td className="p-2 text-muted-foreground">{i + 1}</td>
                          <td className="p-2">
                            <PurchaseProductPicker value={l.product_id}
                              onSelect={(p) => updateLine(i, { product_id: p.id, product_name: p.name })} />
                          </td>
                          <td className="p-2"><Input value={l.description} onChange={e => updateLine(i, { description: e.target.value })} className="h-9 text-sm" placeholder="Optional" /></td>
                          <td className="p-2"><Input type="number" min={1} value={l.quantity} onChange={e => updateLine(i, { quantity: Number(e.target.value) })} className="h-9 text-sm text-right" /></td>
                          <td className="p-2"><Input type="number" min={0} value={l.unit_cost} onChange={e => updateLine(i, { unit_cost: Number(e.target.value) })} className="h-9 text-sm text-right" /></td>
                          <td className="p-2">
                            <Select value={String(l.vat_rate)} onValueChange={(v) => updateLine(i, { vat_rate: Number(v) })}>
                              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="0">0%</SelectItem>
                                <SelectItem value="8">8%</SelectItem>
                                <SelectItem value="16">16%</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-2 text-right font-medium">{(net + vat).toLocaleString()}</td>
                          <td className="p-2"><Button size="icon" variant="ghost" onClick={() => removeLine(i)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="p-3 border-t">
                <Button variant="outline" size="sm" onClick={addLine}><Plus className="h-3.5 w-3.5 mr-1" /> Add Row</Button>
              </div>
            </CardContent>
          </Card>

          {/* Notes + receipts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3"><CardTitle className="text-sm uppercase tracking-wider">Notes</CardTitle></CardHeader>
              <CardContent>
                <textarea className="w-full border rounded-md p-2 text-sm" rows={4} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Internal notes..." />
              </CardContent>
            </Card>
            {savedId ? (
              <PurchaseReceiptsUpload purchaseId={savedId} />
            ) : (
              <Card className="p-4 flex items-center justify-center text-sm text-muted-foreground border-dashed">
                Save the draft first to upload receipts
              </Card>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2"><CardTitle className="text-sm uppercase tracking-wider">Invoice Summary</CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Subtotal (excl. VAT)</span><span>KES {totals.subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Total VAT</span><span>KES {totals.vat.toLocaleString()}</span></div>
              <div className="flex justify-between items-center">
                <label className="flex items-center gap-2 text-muted-foreground cursor-pointer">
                  <input type="checkbox" checked={withholdTax} onChange={e => setWithholdTax(e.target.checked)} />
                  Withhold Tax (2%)
                </label>
                {withholdTax && <span className="text-destructive">- KES {totals.wht.toLocaleString()}</span>}
              </div>
              <div className="border-t pt-2 mt-2 flex justify-between text-base font-bold">
                <span>Grand Total</span><span className="text-primary">KES {totals.payable.toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>

          {supplier && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm uppercase tracking-wider">Supplier Info</CardTitle></CardHeader>
              <CardContent className="text-sm space-y-1">
                <p className="font-bold">{supplier.name}</p>
                {supplier.kra_pin && <p><span className="text-muted-foreground">PIN:</span> {supplier.kra_pin}</p>}
                {supplier.phone && <p><span className="text-muted-foreground">Phone:</span> {supplier.phone}</p>}
                {supplier.email && <p><span className="text-muted-foreground">Email:</span> {supplier.email}</p>}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

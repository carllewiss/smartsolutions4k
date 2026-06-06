import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useUpdateCustomer } from "@/hooks/useCustomers";
import { toast } from "sonner";

export default function EditCustomerDialog({
  open, onOpenChange, customer,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  customer: any;
}) {
  const update = useUpdateCustomer();
  const [form, setForm] = useState({
    name: "", phone: "", email: "", kra_pin: "", location: "",
    debt_limit: 0, credit_terms: 0, is_suspended: false,
  });

  useEffect(() => {
    if (customer) {
      setForm({
        name: customer.name || "",
        phone: customer.phone || "",
        email: customer.email || "",
        kra_pin: customer.kra_pin || "",
        location: customer.location || "",
        debt_limit: Number(customer.debt_limit) || 0,
        credit_terms: Number(customer.credit_terms) || 0,
        is_suspended: !!customer.is_suspended,
      });
    }
  }, [customer]);

  const submit = async () => {
    if (!form.name.trim()) return toast.error("Name is required");
    try {
      await update.mutateAsync({
        id: customer.id,
        name: form.name.trim(),
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || null,
        kra_pin: form.kra_pin.trim().toUpperCase() || null,
        location: form.location.trim() || null,
        debt_limit: Number(form.debt_limit) || 0,
        credit_terms: Number(form.credit_terms) || 0,
        is_suspended: form.is_suspended,
      });
      toast.success("Customer updated");
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2 space-y-1">
            <Label>Name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Phone</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Email</Label>
            <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>KRA PIN</Label>
            <Input className="uppercase" value={form.kra_pin} onChange={(e) => setForm({ ...form, kra_pin: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Location</Label>
            <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
          </div>
          <div className="space-y-1">
            <Label>Credit Terms (days)</Label>
            <select
              className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
              value={form.credit_terms}
              onChange={(e) => setForm({ ...form, credit_terms: Number(e.target.value) })}
            >
              <option value={0}>Cash / 0 days</option>
              <option value={2}>2 days</option>
              <option value={7}>7 days</option>
              <option value={14}>14 days</option>
              <option value={30}>30 days</option>
              <option value={60}>60 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
          <div className="space-y-1">
            <Label>Credit Limit (KES)</Label>
            <Input type="number" min={0} value={form.debt_limit}
              onChange={(e) => setForm({ ...form, debt_limit: Number(e.target.value) })} />
          </div>
          <div className="col-span-2 flex items-center justify-between rounded-md border border-input p-3">
            <div>
              <Label>Suspend account</Label>
              <p className="text-xs text-muted-foreground">Blocks new credit invoices until lifted.</p>
            </div>
            <Switch checked={form.is_suspended} onCheckedChange={(v) => setForm({ ...form, is_suspended: v })} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={submit} disabled={update.isPending}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

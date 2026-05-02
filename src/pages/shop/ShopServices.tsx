import { ShopLayout } from "@/components/shop/ShopLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { buildWaLink, serviceInquiryMessage, WHATSAPP_DISPLAY } from "@/lib/whatsapp";
import { useLogServiceInquiry } from "@/hooks/useShop";
import { toast } from "sonner";
import { MessageCircle, FileCheck, Receipt, GraduationCap, Heart, ShieldCheck, IdCard, Phone, FileText } from "lucide-react";

const SERVICES = [
  { key: "kra_pin", name: "KRA PIN Registration", icon: FileCheck, color: "bg-blue-500", desc: "Apply for new KRA PIN or retrieve lost PIN through iTax." },
  { key: "kra_returns", name: "KRA Tax Returns", icon: Receipt, color: "bg-blue-600", desc: "File your monthly or yearly tax returns with iTax." },
  { key: "etims", name: "eTIMS Registration & Invoicing", icon: ShieldCheck, color: "bg-red-500", desc: "Register on eTIMS and generate compliant invoices." },
  { key: "nssf", name: "NSSF Services", icon: Heart, color: "bg-green-500", desc: "Register as NSSF member, request statements, lost card." },
  { key: "sha", name: "SHA / NHIF Services", icon: Heart, color: "bg-emerald-500", desc: "Register or change health facility under Social Health Authority." },
  { key: "helb", name: "HELB Loan Application", icon: GraduationCap, color: "bg-purple-500", desc: "Apply for HELB loan, change email, statements." },
  { key: "kuccps", name: "KUCCPS Placement", icon: GraduationCap, color: "bg-indigo-500", desc: "Apply or check KUCCPS university placement." },
  { key: "good_conduct", name: "Police Clearance / Good Conduct", icon: ShieldCheck, color: "bg-slate-700", desc: "Apply or renew certificate of good conduct." },
  { key: "ecitizen", name: "eCitizen Account & Phone Change", icon: IdCard, color: "bg-orange-500", desc: "Create eCitizen account or change registered phone." },
  { key: "passport", name: "Passport Application", icon: FileText, color: "bg-amber-600", desc: "Apply or renew Kenyan passport via eCitizen." },
  { key: "business_reg", name: "Business Registration", icon: FileCheck, color: "bg-teal-500", desc: "Register sole proprietorship, partnership or limited company." },
  { key: "phone_unlock", name: "Phone Unlocking & Repair", icon: Phone, color: "bg-pink-500", desc: "Unlock or repair your phone — software & hardware." },
];

export default function ShopServices() {
  const [name, setName] = useState("");
  const log = useLogServiceInquiry();

  const handleClick = async (svc: typeof SERVICES[number]) => {
    const message = serviceInquiryMessage(svc.name, name || undefined);
    try {
      await log.mutateAsync({
        service_key: svc.key,
        service_name: svc.name,
        whatsapp_message: message,
        customer_name: name || undefined,
      });
    } catch {
      // silently fail — opening WhatsApp is more important than the log
    }
    window.open(buildWaLink(message), "_blank", "noopener");
    toast.success(`Opening WhatsApp for ${svc.name}`);
  };

  return (
    <ShopLayout>
      <section className="bg-shop-soft/40 py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold font-heading mb-3">Our Services</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Tap any service to start a WhatsApp chat with our team on <strong>{WHATSAPP_DISPLAY}</strong>. We'll guide you through the process.
          </p>
          <div className="max-w-md mx-auto mt-6">
            <Label htmlFor="cust-name" className="text-left block mb-1 text-sm">Your name (optional, helps us address you)</Label>
            <Input id="cust-name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" />
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {SERVICES.map((svc) => (
          <Card key={svc.key} className="p-6 flex flex-col text-center hover:shadow-lg transition-shadow border-border/40">
            <div className={`${svc.color} h-14 w-14 rounded-full mx-auto flex items-center justify-center mb-4`}>
              <svc.icon className="h-7 w-7 text-white" />
            </div>
            <h3 className="font-bold mb-2 text-shop-deep">{svc.name}</h3>
            <p className="text-sm text-muted-foreground mb-5 flex-1">{svc.desc}</p>
            <Button
              onClick={() => handleClick(svc)}
              className="bg-[#25D366] hover:bg-[#1DA851] text-white"
            >
              <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp Inquiry
            </Button>
          </Card>
        ))}
      </div>
    </ShopLayout>
  );
}

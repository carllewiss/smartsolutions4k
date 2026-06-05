import { useSystemSettings } from "@/hooks/useSystemSettings";
import logo from "@/assets/4k-logo.png.asset.json";
import { COMPANY } from "@/lib/company";

export type InvoicePrintFormat = "thermal" | "b5";

interface PrintItem {
  name: string;
  sku?: string | null;
  quantity: number;
  unit_price: number;
  total: number;
}

interface Props {
  format: InvoicePrintFormat;
  invoiceNumber: string;
  customerName: string;
  customerPin?: string | null;
  customerPhone?: string | null;
  customerAddress?: string | null;
  date: string;
  dueDate?: string | null;
  salesPerson?: string | null;
  paymentTerms?: string | null;
  discount?: number;
  items: PrintItem[];
  subtotal: number;
  tax: number;
  total: number;
  etimsStatus?: string;
  etimsSignature?: string | null;
  etimsQrData?: string | null;
  isReprint?: boolean;
  reprintCount?: number;
}

// Brand palette (print only — kept as literals so colours survive @media print)
const TEAL = "#0f6b66";
const TEAL_DARK = "#0b524e";
const LIGHT = "#eef6f5";

interface CopyDef {
  label: string;
  isFileCopy: boolean;
}

const COPIES: CopyDef[] = [
  { label: "CUSTOMER COPY", isFileCopy: false },
  { label: "FILE COPY", isFileCopy: true },
  { label: "FILE COPY", isFileCopy: true },
];

const money = (n: number) =>
  n.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * Multi-format print document for invoices.
 * - Thermal: monospace 80mm receipt mirroring the approved 4K receipt layout, ONE copy only.
 * - B5: modern branded TAX INVOICE + DELIVERY NOTE per copy (1 customer + 2 file copies),
 *   file copies carry a diagonal "COPY" watermark.
 * Render with id="invoice-print-root"; isolation handled by index.css (body.printing-invoice).
 */
export function InvoiceDocumentPrint(props: Props) {
  const { data: settings } = useSystemSettings();
  const businessName = settings?.business_name || COMPANY.name;
  const companyPin = COMPANY.kraPin;
  const isSigned = props.etimsStatus === "signed";
  const docTitle = isSigned ? "TAX INVOICE" : "INVOICE";

  const fmtDate = (d?: string | null, withTime = false) => {
    if (!d) return "—";
    const date = new Date(d);
    const day = date.toLocaleDateString("en-GB");
    return withTime
      ? `${day} ${date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}`
      : day;
  };

  // ---------------- THERMAL (80mm) — single receipt, image layout ----------------
  if (props.format === "thermal") {
    const dash = <div className="border-t border-dashed border-black my-1" />;
    return (
      <div className="bg-white text-black" id="invoice-print-root">
        <style>{`@media print { @page { size: 80mm auto; margin: 3mm; } }`}</style>
        <div className="font-mono text-[8pt] leading-snug" style={{ width: "74mm" }}>
          {/* Header */}
          <div className="text-center">
            <img src={logo.url} alt="logo" style={{ height: "13mm", margin: "0 auto 1mm" }} />
            <p className="font-bold text-[12pt] tracking-wide leading-none">SMART SOLUTIONS</p>
            <p className="text-[6.5pt] mb-1">{COMPANY.tagline}</p>
            <p className="text-[7pt]">{COMPANY.address}</p>
            <p className="text-[7pt]">Tel: {COMPANY.phone}</p>
            <p className="text-[7pt]">Email: {COMPANY.email}</p>
            <p className="text-[7pt]">PIN: {companyPin} | VAT: {COMPANY.vatNo}</p>
          </div>

          {dash}
          <p className="text-center font-bold text-[12pt] tracking-widest">{docTitle}</p>
          {dash}

          {/* Meta */}
          <div className="text-[7.5pt]">
            <div className="flex"><span className="w-[26mm]">Invoice No</span><span>: {props.invoiceNumber}</span></div>
            <div className="flex"><span className="w-[26mm]">Date</span><span>: {fmtDate(props.date, true)}</span></div>
            {props.dueDate && <div className="flex"><span className="w-[26mm]">Due Date</span><span>: {fmtDate(props.dueDate)}</span></div>}
            {props.salesPerson && <div className="flex"><span className="w-[26mm]">Sales Person</span><span>: {props.salesPerson}</span></div>}
            {props.paymentTerms && <div className="flex"><span className="w-[26mm]">Payment Terms</span><span>: {props.paymentTerms}</span></div>}
          </div>

          {dash}
          {/* Bill to */}
          <div className="text-[7.5pt]">
            <p>Bill To:</p>
            <p className="font-bold text-[8.5pt]">{props.customerName}</p>
            {props.customerAddress && <p>{props.customerAddress}</p>}
            {props.customerPin && <p>PIN: {props.customerPin.toUpperCase()}</p>}
            {props.customerPhone && <p>Tel: {props.customerPhone}</p>}
          </div>

          {dash}
          {/* Items */}
          <table className="w-full text-[7pt]">
            <thead>
              <tr className="border-b border-black">
                <th className="text-left pb-0.5">QTY</th>
                <th className="text-left pb-0.5">ITEM</th>
                <th className="text-right pb-0.5">PRICE</th>
                <th className="text-right pb-0.5">VAT</th>
                <th className="text-right pb-0.5">AMOUNT</th>
              </tr>
            </thead>
            <tbody>
              {props.items.map((it, i) => (
                <tr key={i} className="align-top">
                  <td className="pt-0.5">{it.quantity}</td>
                  <td className="pt-0.5 pr-1">{it.name}</td>
                  <td className="text-right pt-0.5 whitespace-nowrap">{money(it.unit_price)}</td>
                  <td className="text-right pt-0.5">16%</td>
                  <td className="text-right pt-0.5 whitespace-nowrap">{money(it.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {dash}
          {/* Totals */}
          <div className="text-[7.5pt]">
            <div className="flex justify-between"><span>Subtotal (Excl. VAT)</span><span>{money(props.subtotal)}</span></div>
            <div className="flex justify-between"><span>VAT (16%)</span><span>{money(props.tax)}</span></div>
            <div className="flex justify-between"><span>Discount</span><span>{money(props.discount || 0)}</span></div>
          </div>
          {dash}
          <div className="flex justify-between font-bold text-[10pt]">
            <span>TOTAL DUE</span><span>KES {money(props.total)}</span>
          </div>
          <div className="border-t-2 border-double border-black my-1" />

          {/* Payment details */}
          <div className="text-[7pt]">
            <p>Payment Details:</p>
            <p>Bank: {COMPANY.bankName}</p>
            <p>A/C Name: {COMPANY.accountName}</p>
            <p>A/C No: {COMPANY.accountNo}</p>
            <p>MPESA Paybill: {COMPANY.paybill}</p>
            <p>A/C No: {COMPANY.paybillAccount}</p>
          </div>

          {props.isReprint && <p className="text-center text-[7pt] mt-1">REPRINT #{props.reprintCount || 1}</p>}
          {isSigned && props.etimsSignature && (
            <p className="text-center text-[6.5pt] mt-1 break-all">eTIMS: {props.etimsSignature}</p>
          )}

          {dash}
          <div className="text-center text-[7.5pt] leading-tight">
            <p className="font-bold">Thank you for your business!</p>
            <p>Goods once sold are not returnable.</p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- B5 FULL (modern Invoice + Delivery Note) ----------------
  const Watermark = ({ text }: { text: string }) => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
      <span className="text-[150px] font-black rotate-[-32deg] select-none tracking-widest" style={{ color: "rgba(15,107,102,0.07)" }}>
        {text}
      </span>
    </div>
  );

  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-GB") : "—");

  // Modern header band: full-width teal bar with logo + doc title + copy chip.
  const HeaderBand = ({ title, copyLabel }: { title: string; copyLabel: string }) => (
    <div className="relative mb-5" style={{ zIndex: 10 }}>
      <div className="flex items-stretch overflow-hidden rounded-xl" style={{ boxShadow: "0 8px 22px -12px rgba(15,107,102,0.55)" }}>
        <div className="flex items-center gap-3 px-5 py-4 flex-1" style={{ background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})` }}>
          <div className="bg-white rounded-lg p-1.5 flex items-center justify-center">
            <img src={logo.url} alt="4K Smart" style={{ height: "13mm" }} />
          </div>
          <div className="text-white leading-tight">
            <p className="text-[14pt] font-extrabold tracking-tight">{businessName}</p>
            <p className="text-[8pt] opacity-90">{COMPANY.tagline}</p>
            <p className="text-[7.5pt] opacity-80 mt-0.5">{COMPANY.services}</p>
          </div>
        </div>
        <div className="flex flex-col items-end justify-center px-5 py-4 text-right" style={{ backgroundColor: "#0a3f3c" }}>
          <p className="text-white text-[18pt] font-extrabold tracking-tight leading-none">{title}</p>
          <span className="mt-2 text-[7.5pt] font-bold text-white/90 border border-white/40 rounded-full px-2 py-0.5">{copyLabel}</span>
        </div>
      </div>
    </div>
  );

  const CompanyStrip = () => (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[8pt] text-gray-600 mb-4 px-1 relative" style={{ zIndex: 10 }}>
      <span>📍 {COMPANY.address}</span>
      <span>📞 {COMPANY.phone}</span>
      <span>✉ {COMPANY.email}</span>
      <span className="font-semibold" style={{ color: TEAL }}>PIN: {companyPin}</span>
      <span className="font-semibold" style={{ color: TEAL }}>VAT: {COMPANY.vatNo}</span>
    </div>
  );

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-lg overflow-hidden border border-gray-200 relative" style={{ zIndex: 10 }}>
      <div className="text-[8pt] font-bold tracking-wide px-3 py-1.5 text-white" style={{ backgroundColor: TEAL }}>{title}</div>
      <div className="px-3 py-2 text-[9pt]" style={{ backgroundColor: "#fbfdfd" }}>{children}</div>
    </div>
  );

  const KraFooterBar = () => (
    <div className="absolute left-0 right-0 bottom-0 text-white text-[7.5pt] flex items-center justify-between px-5 py-2.5" style={{ background: `linear-gradient(90deg, ${TEAL_DARK}, ${TEAL})`, zIndex: 10 }}>
      <span>KRA PIN: <b>{companyPin}</b> · VAT No: <b>{COMPANY.vatNo}</b></span>
      <span className="font-semibold">Smart Business. Smarter Solutions.</span>
      <span>{COMPANY.website}</span>
    </div>
  );

  const pageStyle = (last: boolean): React.CSSProperties => ({
    width: "176mm",
    minHeight: "250mm",
    padding: "10mm 10mm 16mm",
    position: "relative",
    pageBreakAfter: last ? "auto" : "always",
  });

  const totalPages = COPIES.length * 2;
  let pageIndex = 0;

  return (
    <div className="bg-white text-black" id="invoice-print-root">
      <style>{`@media print { @page { size: B5; margin: 0; } }`}</style>
      {COPIES.map((copy, ci) => {
        ++pageIndex;
        const invoicePage = (
          <div key={`inv-${ci}`} className="bg-white text-black mx-auto" style={pageStyle(false)}>
            {copy.isFileCopy && <Watermark text="COPY" />}
            <HeaderBand title={isSigned ? "TAX INVOICE" : "INVOICE"} copyLabel={copy.label} />
            <CompanyStrip />

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Card title="BILL TO">
                <p className="font-bold text-[10pt]">{props.customerName}</p>
                {props.customerAddress && <p>{props.customerAddress}</p>}
                {props.customerPin && <p>PIN: {props.customerPin.toUpperCase()}</p>}
                {props.customerPhone && <p>Tel: {props.customerPhone}</p>}
              </Card>
              <Card title="INVOICE DETAILS">
                <div className="space-y-0.5">
                  <div className="flex justify-between"><span className="text-gray-500">Invoice No.</span><span className="font-semibold">{props.invoiceNumber}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-semibold">{fmt(props.date)}</span></div>
                  {props.dueDate && <div className="flex justify-between"><span className="text-gray-500">Due Date</span><span className="font-semibold">{fmt(props.dueDate)}</span></div>}
                  <div className="flex justify-between"><span className="text-gray-500">Currency</span><span className="font-semibold">KES</span></div>
                </div>
              </Card>
            </div>

            <table className="w-full text-[9pt] border-collapse relative mb-4 overflow-hidden rounded-lg" style={{ zIndex: 10 }}>
              <thead>
                <tr className="text-white" style={{ backgroundColor: TEAL }}>
                  <th className="text-left py-2 px-3 w-8">#</th>
                  <th className="text-left py-2 px-3">DESCRIPTION</th>
                  <th className="text-right py-2 px-3 w-12">QTY</th>
                  <th className="text-right py-2 px-3 w-24">UNIT PRICE</th>
                  <th className="text-right py-2 px-3 w-14">VAT</th>
                  <th className="text-right py-2 px-3 w-28">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {props.items.map((it, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 ? "#f4f9f8" : "#ffffff" }}>
                    <td className="py-1.5 px-3">{i + 1}</td>
                    <td className="py-1.5 px-3">
                      <div className="font-semibold">{it.name}</div>
                      {it.sku && <div className="text-[7.5pt] text-gray-500">SKU: {it.sku}</div>}
                    </td>
                    <td className="text-right py-1.5 px-3">{it.quantity}</td>
                    <td className="text-right py-1.5 px-3 font-mono">{money(it.unit_price)}</td>
                    <td className="text-right py-1.5 px-3">16%</td>
                    <td className="text-right py-1.5 px-3 font-mono">{money(it.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-4 relative" style={{ zIndex: 10 }}>
              <Card title="PAYMENT DETAILS">
                <div className="space-y-0.5 text-[8.5pt]">
                  <p>Bank: <b>{COMPANY.bankName}</b></p>
                  <p>Account Name: {COMPANY.accountName}</p>
                  <p>Account No.: {COMPANY.accountNo}</p>
                  <p>MPESA Paybill: <b>{COMPANY.paybill}</b></p>
                  <p>Account: {COMPANY.paybillAccount}</p>
                </div>
              </Card>
              <div className="rounded-lg overflow-hidden border border-gray-200 text-[9.5pt] self-start">
                <div className="flex justify-between px-3 py-1.5 border-b border-gray-100"><span className="text-gray-500">Subtotal (Excl. VAT)</span><span className="font-mono">KES {money(props.subtotal)}</span></div>
                <div className="flex justify-between px-3 py-1.5 border-b border-gray-100"><span className="text-gray-500">VAT (16%)</span><span className="font-mono">KES {money(props.tax)}</span></div>
                {!!props.discount && <div className="flex justify-between px-3 py-1.5 border-b border-gray-100"><span className="text-gray-500">Discount</span><span className="font-mono">KES {money(props.discount)}</span></div>}
                <div className="flex justify-between items-center text-white font-bold px-3 py-2.5 text-[12pt]" style={{ background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})` }}>
                  <span>TOTAL DUE</span><span className="font-mono">KES {money(props.total)}</span>
                </div>
              </div>
            </div>

            <div className="mt-5 text-[8pt] text-gray-500 italic relative" style={{ zIndex: 10 }}>
              Thank you for your business. Goods once sold are not returnable.
            </div>
            {props.isReprint && (
              <p className="text-[8pt] mt-1 font-bold relative" style={{ zIndex: 10, color: TEAL }}>REPRINT — DUPLICATE COPY #{props.reprintCount || 1}</p>
            )}
            <KraFooterBar />
          </div>
        );

        const dnLast = ++pageIndex === totalPages;
        const deliveryPage = (
          <div key={`dn-${ci}`} className="bg-white text-black mx-auto" style={pageStyle(dnLast)}>
            {copy.isFileCopy && <Watermark text="COPY" />}
            <HeaderBand title="DELIVERY NOTE" copyLabel={copy.label} />
            <CompanyStrip />

            <div className="grid grid-cols-2 gap-4 mb-4">
              <Card title="DELIVER TO">
                <p className="font-bold text-[10pt]">{props.customerName}</p>
                {props.customerAddress && <p>{props.customerAddress}</p>}
                {props.customerPhone && <p>Tel: {props.customerPhone}</p>}
              </Card>
              <Card title="DELIVERY DETAILS">
                <div className="space-y-0.5">
                  <div className="flex justify-between"><span className="text-gray-500">D/Note No.</span><span className="font-semibold">{props.invoiceNumber.replace(/^INV/, "DN")}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-semibold">{fmt(props.date)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Reference</span><span className="font-semibold">{props.invoiceNumber}</span></div>
                </div>
              </Card>
            </div>

            <table className="w-full text-[9pt] border-collapse relative mb-4 overflow-hidden rounded-lg" style={{ zIndex: 10 }}>
              <thead>
                <tr className="text-white" style={{ backgroundColor: TEAL }}>
                  <th className="text-left py-2 px-3 w-8">#</th>
                  <th className="text-left py-2 px-3">DESCRIPTION</th>
                  <th className="text-right py-2 px-3 w-24">QTY ORDERED</th>
                  <th className="text-right py-2 px-3 w-24">QTY DELIVERED</th>
                  <th className="text-left py-2 px-3 w-24">REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {props.items.map((it, i) => (
                  <tr key={i} style={{ backgroundColor: i % 2 ? "#f4f9f8" : "#ffffff" }}>
                    <td className="py-1.5 px-3">{i + 1}</td>
                    <td className="py-1.5 px-3">
                      <div className="font-semibold">{it.name}</div>
                      {it.sku && <div className="text-[7.5pt] text-gray-500">SKU: {it.sku}</div>}
                    </td>
                    <td className="text-right py-1.5 px-3">{it.quantity}</td>
                    <td className="text-right py-1.5 px-3">{it.quantity}</td>
                    <td className="py-1.5 px-3">—</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-4 relative" style={{ zIndex: 10 }}>
              <Card title="REMARKS / NOTES">
                <div className="min-h-[24mm] text-[8.5pt]">Goods received in good condition.</div>
              </Card>
              <Card title="RECEIVED BY">
                <div className="space-y-4 text-[9pt] py-1">
                  <p>Name: <span className="inline-block border-b border-gray-400 w-40 ml-1" /></p>
                  <p>Signature: <span className="inline-block border-b border-gray-400 w-32 ml-1" /></p>
                  <p>Date: <span className="inline-block border-b border-gray-400 w-40 ml-1" /></p>
                </div>
              </Card>
            </div>

            <p className="mt-5 text-[8pt] text-gray-500 italic relative" style={{ zIndex: 10 }}>
              Smart Solutions for a Smarter Tomorrow.
            </p>
            <KraFooterBar />
          </div>
        );

        return [invoicePage, deliveryPage];
      })}
    </div>
  );
}

import { useSystemSettings } from "@/hooks/useSystemSettings";
import logo from "@/assets/4k-logo.png.asset.json";

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

const COMPANY = {
  address: "P.O Box 12345 - 00100, Nairobi, Kenya",
  phone: "+254 700 000 000  |  0736 217 411",
  email: "info@4ksmart.co.ke  |  www.4ksmart.co.ke",
  vatNo: "0123456A",
  bankName: "KCB Bank Kenya",
  accountName: "4K Smart Solutions Ltd",
  accountNo: "1234567890",
  paybill: "247247",
  paybillAccount: "4KSmart",
};

interface CopyDef {
  label: string;
  isFileCopy: boolean;
}

const COPIES: CopyDef[] = [
  { label: "CUSTOMER COPY", isFileCopy: false },
  { label: "FILE COPY", isFileCopy: true },
  { label: "FILE COPY", isFileCopy: true },
];

/**
 * Multi-format print document for invoices.
 * - Thermal: narrow 80mm receipt, ONE copy only.
 * - B5: branded TAX INVOICE + DELIVERY NOTE per copy (1 customer + 2 file copies),
 *   file copies carry a diagonal "COPY" watermark.
 * Render with id="invoice-print-root"; isolation handled by index.css (body.printing-invoice).
 */
export function InvoiceDocumentPrint(props: Props) {
  const { data: settings } = useSystemSettings();
  const businessName = settings?.business_name || "4K SMART SOLUTIONS LTD";
  const companyPin = settings?.etims_kra_pin || "P051234567B";
  const isSigned = props.etimsStatus === "signed";
  const docTitle = isSigned ? "TAX INVOICE" : "INVOICE";

  // ---------------- THERMAL (80mm) — single receipt ----------------
  if (props.format === "thermal") {
    return (
      <div className="bg-white text-black" id="invoice-print-root">
        <style>{`@media print { @page { size: 80mm auto; margin: 3mm; } }`}</style>
        <div className="font-mono text-[9pt] leading-tight" style={{ width: "74mm" }}>
          <div className="text-center">
            <img src={logo.url} alt="logo" style={{ height: "14mm", margin: "0 auto 1mm" }} />
            <p className="font-bold text-[11pt]">{businessName}</p>
            <p className="text-[7pt]">Phone Accessories · Internet · Printing</p>
            <p className="text-[7pt]">{COMPANY.phone}</p>
            {companyPin && <p className="text-[7pt]">PIN: {companyPin.toUpperCase()}</p>}
          </div>
          <div className="text-center my-1 font-bold border-y border-dashed border-black py-0.5">
            {docTitle}
          </div>
          <div className="flex justify-between text-[8pt]">
            <span>{props.invoiceNumber}</span>
            <span>{new Date(props.date).toLocaleDateString()}</span>
          </div>
          <p className="text-[8pt]">To: {props.customerName}</p>
          {props.customerPin && <p className="text-[8pt]">Cust PIN: {props.customerPin.toUpperCase()}</p>}
          <div className="border-t border-dashed border-black my-1" />
          {props.items.map((it, i) => (
            <div key={i} className="text-[8pt]">
              <div>{it.name}</div>
              <div className="flex justify-between">
                <span>{it.quantity} x {it.unit_price.toLocaleString()}</span>
                <span>{it.total.toLocaleString()}</span>
              </div>
            </div>
          ))}
          <div className="border-t border-dashed border-black my-1" />
          <div className="flex justify-between text-[8pt]"><span>Subtotal</span><span>{props.subtotal.toLocaleString()}</span></div>
          <div className="flex justify-between text-[8pt]"><span>VAT</span><span>{props.tax.toLocaleString()}</span></div>
          <div className="flex justify-between font-bold text-[10pt] border-t border-black mt-0.5 pt-0.5">
            <span>TOTAL</span><span>KES {props.total.toLocaleString()}</span>
          </div>
          {props.isReprint && (
            <div className="text-center text-[7pt] mt-1">REPRINT #{props.reprintCount || 1}</div>
          )}
          <div className="mt-2 pt-1 border-t border-dashed border-black text-[7pt] text-center leading-tight">
            <p>KRA PIN: {companyPin.toUpperCase()} · VAT No: {COMPANY.vatNo}</p>
            {isSigned && props.etimsSignature && <p className="break-all">eTIMS: {props.etimsSignature}</p>}
            <p className="mt-1 italic">Goods once sold are not returnable.</p>
            <p className="italic">Thank you for your business!</p>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- B5 FULL (Invoice + Delivery Note) ----------------
  const Watermark = ({ text }: { text: string }) => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
      <span className="text-[130px] font-black rotate-[-30deg] select-none tracking-widest" style={{ color: "rgba(15,107,102,0.10)" }}>
        {text}
      </span>
    </div>
  );

  const fmt = (d?: string | null) => (d ? new Date(d).toLocaleDateString("en-GB").replace(/\//g, " / ") : "—");

  const BrandHeader = ({ title }: { title: string }) => (
    <div className="flex justify-between items-start mb-4 relative" style={{ zIndex: 10 }}>
      <div className="flex items-center gap-2">
        <img src={logo.url} alt="4K Smart" style={{ height: "16mm" }} />
      </div>
      <h2 className="text-[26pt] font-extrabold tracking-tight" style={{ color: TEAL }}>{title}</h2>
    </div>
  );

  const CompanyInfo = () => (
    <div className="text-[8.5pt] leading-snug relative" style={{ zIndex: 10 }}>
      <p>📍 {COMPANY.address}</p>
      <p>📞 {COMPANY.phone}</p>
      <p>✉ {COMPANY.email}</p>
      <p>PIN: <span className="font-bold">{companyPin.toUpperCase()}</span> &nbsp; VAT No: <span className="font-bold">{COMPANY.vatNo}</span></p>
    </div>
  );

  const SectionBar = ({ children }: { children: React.ReactNode }) => (
    <div className="text-white text-[8.5pt] font-bold px-2 py-1" style={{ backgroundColor: TEAL }}>{children}</div>
  );

  const InfoBox = ({ rows, total }: { rows: [string, string][]; total?: [string, string] }) => (
    <div className="relative" style={{ zIndex: 10 }}>
      <div className="border border-gray-300 text-[8.5pt]">
        {rows.map(([k, v], i) => (
          <div key={i} className="flex justify-between px-2 py-1 border-b border-gray-200">
            <span className="font-semibold">{k}</span>
            <span>{v}</span>
          </div>
        ))}
      </div>
      {total && (
        <div className="flex justify-between text-white font-bold px-2 py-1.5 text-[10pt]" style={{ backgroundColor: TEAL_DARK }}>
          <span>{total[0]}</span><span>{total[1]}</span>
        </div>
      )}
    </div>
  );

  const KraFooterBar = () => (
    <div className="absolute left-0 right-0 bottom-0 text-white text-[8pt] flex items-center justify-between px-4 py-2" style={{ backgroundColor: TEAL, zIndex: 10 }}>
      <span>📞 {COMPANY.phone}</span>
      <span>✉ info@4ksmart.co.ke</span>
      <span className="font-bold">Thank you for choosing 4K Smart Solutions</span>
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
            <BrandHeader title={isSigned ? "TAX INVOICE" : "INVOICE"} />

            <div className="grid grid-cols-2 gap-4 mb-4">
              <CompanyInfo />
              <InfoBox
                rows={[
                  ["Invoice No.", props.invoiceNumber],
                  ["Invoice Date", fmt(props.date)],
                  ["Due Date", fmt(props.dueDate)],
                ]}
                total={["TOTAL DUE", `KES ${props.total.toLocaleString()}`]}
              />
            </div>

            <div className="absolute" style={{ top: "10mm", right: "10mm", zIndex: 11 }}>
              <span className="text-[8pt] font-bold border px-1.5 py-0.5" style={{ borderColor: TEAL, color: TEAL }}>{copy.label}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-3 relative" style={{ zIndex: 10 }}>
              <div>
                <SectionBar>BILL TO</SectionBar>
                <div className="px-2 py-2 text-[9pt]" style={{ backgroundColor: LIGHT }}>
                  <p className="font-bold">{props.customerName}</p>
                  {props.customerAddress && <p>{props.customerAddress}</p>}
                  {props.customerPin && <p>PIN: {props.customerPin.toUpperCase()}</p>}
                  {props.customerPhone && <p>Phone: {props.customerPhone}</p>}
                </div>
              </div>
              <div>
                <SectionBar>OTHER DETAILS</SectionBar>
                <div className="px-2 py-2 text-[9pt]" style={{ backgroundColor: LIGHT }}>
                  <div className="flex justify-between"><span>Payment Terms</span><span className="font-semibold">Due on receipt</span></div>
                  <div className="flex justify-between"><span>Currency</span><span className="font-semibold">KES - Kenyan Shilling</span></div>
                  <div className="flex justify-between"><span>Reference</span><span className="font-semibold">{props.invoiceNumber}</span></div>
                </div>
              </div>
            </div>

            <table className="w-full text-[9pt] border-collapse relative mb-3" style={{ zIndex: 10 }}>
              <thead>
                <tr className="text-white" style={{ backgroundColor: TEAL }}>
                  <th className="text-left py-1.5 px-2 w-8">#</th>
                  <th className="text-left py-1.5 px-2">DESCRIPTION</th>
                  <th className="text-right py-1.5 px-2 w-12">QTY</th>
                  <th className="text-right py-1.5 px-2 w-20">UNIT PRICE</th>
                  <th className="text-right py-1.5 px-2 w-14">VAT</th>
                  <th className="text-right py-1.5 px-2 w-24">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {props.items.map((it, i) => (
                  <tr key={i} className="border-b border-gray-300">
                    <td className="py-1.5 px-2">{i + 1}</td>
                    <td className="py-1.5 px-2">
                      <div className="font-semibold">{it.name}</div>
                      {it.sku && <div className="text-[7.5pt] text-gray-500">SKU: {it.sku}</div>}
                    </td>
                    <td className="text-right py-1.5 px-2">{it.quantity}</td>
                    <td className="text-right py-1.5 px-2 font-mono">{it.unit_price.toLocaleString()}</td>
                    <td className="text-right py-1.5 px-2">16%</td>
                    <td className="text-right py-1.5 px-2 font-mono">{it.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-4 relative" style={{ zIndex: 10 }}>
              <div>
                <SectionBar>PAYMENT DETAILS</SectionBar>
                <div className="px-2 py-2 text-[8.5pt]" style={{ backgroundColor: LIGHT }}>
                  <p>Bank: {COMPANY.bankName}</p>
                  <p>Account Name: {COMPANY.accountName}</p>
                  <p>Account No.: {COMPANY.accountNo}</p>
                  <p>MPESA Paybill: {COMPANY.paybill}</p>
                  <p>Account: {COMPANY.paybillAccount}</p>
                </div>
              </div>
              <div className="text-[9.5pt]">
                <div className="flex justify-between px-2 py-1 border-b border-gray-200"><span>Subtotal (Excl. VAT)</span><span className="font-mono">KES {props.subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between px-2 py-1 border-b border-gray-200"><span>VAT (16%)</span><span className="font-mono">KES {props.tax.toLocaleString()}</span></div>
                <div className="flex justify-between text-white font-bold px-2 py-2 text-[11pt] mt-1" style={{ backgroundColor: TEAL_DARK }}>
                  <span>TOTAL DUE</span><span className="font-mono">KES {props.total.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="mt-4 text-[8pt] italic relative" style={{ zIndex: 10 }}>
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
            <BrandHeader title="DELIVERY NOTE" />

            <div className="grid grid-cols-2 gap-4 mb-4">
              <CompanyInfo />
              <InfoBox
                rows={[
                  ["Delivery Note No.", props.invoiceNumber.replace(/^INV/, "DN")],
                  ["Delivery Date", fmt(props.date)],
                  ["Reference", props.invoiceNumber],
                ]}
              />
            </div>

            <div className="absolute" style={{ top: "10mm", right: "10mm", zIndex: 11 }}>
              <span className="text-[8pt] font-bold border px-1.5 py-0.5" style={{ borderColor: TEAL, color: TEAL }}>{copy.label}</span>
            </div>

            <div className="mb-3 relative" style={{ zIndex: 10 }}>
              <SectionBar>DELIVER TO</SectionBar>
              <div className="px-2 py-2 text-[9pt]" style={{ backgroundColor: LIGHT }}>
                <p className="font-bold">{props.customerName}</p>
                {props.customerAddress && <p>{props.customerAddress}</p>}
                {props.customerPhone && <p>Phone: {props.customerPhone}</p>}
              </div>
            </div>

            <table className="w-full text-[9pt] border-collapse relative mb-3" style={{ zIndex: 10 }}>
              <thead>
                <tr className="text-white" style={{ backgroundColor: TEAL }}>
                  <th className="text-left py-1.5 px-2 w-8">#</th>
                  <th className="text-left py-1.5 px-2">DESCRIPTION</th>
                  <th className="text-right py-1.5 px-2 w-24">QTY ORDERED</th>
                  <th className="text-right py-1.5 px-2 w-24">QTY DELIVERED</th>
                  <th className="text-left py-1.5 px-2 w-24">REMARKS</th>
                </tr>
              </thead>
              <tbody>
                {props.items.map((it, i) => (
                  <tr key={i} className="border-b border-gray-300">
                    <td className="py-1.5 px-2">{i + 1}</td>
                    <td className="py-1.5 px-2">
                      <div className="font-semibold">{it.name}</div>
                      {it.sku && <div className="text-[7.5pt] text-gray-500">SKU: {it.sku}</div>}
                    </td>
                    <td className="text-right py-1.5 px-2">{it.quantity}</td>
                    <td className="text-right py-1.5 px-2">{it.quantity}</td>
                    <td className="py-1.5 px-2">—</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-4 relative" style={{ zIndex: 10 }}>
              <div>
                <SectionBar>REMARKS / NOTES</SectionBar>
                <div className="px-2 py-3 text-[8.5pt] min-h-[24mm]" style={{ backgroundColor: LIGHT }}>
                  Goods received in good condition.
                </div>
              </div>
              <div>
                <SectionBar>RECEIVED BY</SectionBar>
                <div className="px-2 py-3 text-[9pt] space-y-4" style={{ backgroundColor: LIGHT }}>
                  <p>Name: <span className="inline-block border-b border-black w-40 ml-1" /></p>
                  <p>Signature: <span className="inline-block border-b border-black w-32 ml-1" /></p>
                  <p>Date: <span className="inline-block border-b border-black w-40 ml-1" /></p>
                </div>
              </div>
            </div>

            <p className="mt-4 text-[8pt] italic relative" style={{ zIndex: 10 }}>
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

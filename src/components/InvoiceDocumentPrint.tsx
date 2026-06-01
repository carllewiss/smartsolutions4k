import { useSystemSettings } from "@/hooks/useSystemSettings";

export type InvoicePrintFormat = "thermal" | "b5";

interface PrintItem {
  name: string;
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
  date: string;
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

const COMPANY_PHONE = "0736 217 411";

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
 * Multi-format, multi-copy print document for invoices.
 * - Thermal: narrow 80mm receipt, 3 receipts (1 customer + 2 file copies).
 * - B5: full TAX INVOICE + DELIVERY NOTE per copy (1 customer + 2 file copies),
 *   file copies carry a diagonal "COPY" watermark.
 * KRA / company tax details are printed at the bottom of both formats.
 *
 * Render this with id="invoice-print-root" and the `hidden print:block` classes;
 * isolation is handled by the @media print rules in index.css (body.printing-invoice).
 */
export function InvoiceDocumentPrint(props: Props) {
  const { data: settings } = useSystemSettings();
  const businessName = settings?.business_name || "4K SMART SOLUTIONS LTD";
  const companyPin = settings?.etims_kra_pin || "";
  const isSigned = props.etimsStatus === "signed";
  const docTitle = isSigned ? "TAX INVOICE" : "SALES INVOICE";

  const KraFooter = ({ small }: { small?: boolean }) => (
    <div className={`mt-3 pt-2 border-t-2 border-black ${small ? "text-[7pt]" : "text-[8pt]"} leading-tight`}>
      <p className="font-bold">{businessName}</p>
      {companyPin && <p>KRA PIN: <span className="font-mono font-bold">{companyPin.toUpperCase()}</span></p>}
      <p>Tel: {COMPANY_PHONE}</p>
      {isSigned && props.etimsSignature && (
        <p className="font-mono">eTIMS Sig: {props.etimsSignature}</p>
      )}
      {isSigned && props.etimsQrData && (
        <p className="font-mono break-all">Verify: {props.etimsQrData}</p>
      )}
      {!isSigned && props.etimsStatus === "pending_sync" && (
        <p className="italic">Pending KRA eTIMS transmission.</p>
      )}
      <p className="mt-1 italic">Goods once sold are subject to our return policy. Thank you for your business.</p>
    </div>
  );

  // ---------------- THERMAL (80mm) ----------------
  if (props.format === "thermal") {
    return (
      <div className="bg-white text-black" id="invoice-print-root">
        <style>{`@media print { @page { size: 80mm auto; margin: 3mm; } }`}</style>
        {COPIES.map((copy, ci) => (
          <div
            key={ci}
            className="font-mono text-[9pt] leading-tight"
            style={{ width: "74mm", pageBreakAfter: ci < COPIES.length - 1 ? "always" : "auto" }}
          >
            <div className="text-center">
              <p className="font-bold text-[11pt]">{businessName}</p>
              <p className="text-[7pt]">Phone Accessories · Internet · Printing</p>
              <p className="text-[7pt]">Tel: {COMPANY_PHONE}</p>
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
            <div className="text-center mt-1 text-[8pt] font-bold">
              {copy.isFileCopy ? "*** FILE COPY ***" : "*** CUSTOMER COPY ***"}
            </div>
            {props.isReprint && (
              <div className="text-center text-[7pt]">REPRINT #{props.reprintCount || 1}</div>
            )}
            <KraFooter small />
          </div>
        ))}
      </div>
    );
  }

  // ---------------- B5 FULL (Invoice + Delivery Note) ----------------
  const Watermark = ({ text }: { text: string }) => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
      <span className="text-[120px] font-black text-gray-300 opacity-40 rotate-[-30deg] select-none tracking-widest">
        {text}
      </span>
    </div>
  );

  const Header = ({ subtitle, copyLabel }: { subtitle: string; copyLabel: string }) => (
    <div className="flex justify-between items-start border-b-2 border-black pb-2 mb-3 relative z-10">
      <div>
        <h1 className="text-xl font-extrabold">{businessName}</h1>
        <p className="text-[9pt]">Phone Accessories · Internet · Printing</p>
        <p className="text-[9pt]">Tel: {COMPANY_PHONE}</p>
        {companyPin && <p className="text-[9pt]">KRA PIN: <span className="font-mono font-bold">{companyPin.toUpperCase()}</span></p>}
      </div>
      <div className="text-right">
        <h2 className="text-lg font-bold">{subtitle}</h2>
        <p className="text-[9pt]">No: <span className="font-bold">{props.invoiceNumber}</span></p>
        <p className="text-[9pt]">Date: {new Date(props.date).toLocaleDateString()}</p>
        <p className="text-[8pt] font-bold mt-1 inline-block border border-black px-1">{copyLabel}</p>
      </div>
    </div>
  );

  const BillTo = () => (
    <div className="mb-3 text-[10pt] relative z-10">
      <p><span className="font-bold">To:</span> {props.customerName}</p>
      {props.customerPhone && <p><span className="font-bold">Tel:</span> {props.customerPhone}</p>}
      {props.customerPin && <p className="font-mono"><span className="font-bold">KRA PIN:</span> {props.customerPin.toUpperCase()}</p>}
    </div>
  );

  const pageStyle = (last: boolean): React.CSSProperties => ({
    width: "176mm",
    minHeight: "240mm",
    padding: "10mm",
    pageBreakAfter: last ? "auto" : "always",
  });

  const totalPages = COPIES.length * 2;
  let pageIndex = 0;

  return (
    <div className="bg-white text-black" id="invoice-print-root">
      <style>{`@media print { @page { size: B5; margin: 0; } }`}</style>
      {COPIES.map((copy, ci) => {
        const invoiceLast = ++pageIndex === totalPages;
        const invoicePage = (
          <div key={`inv-${ci}`} className="relative bg-white text-black mx-auto" style={pageStyle(false)}>
            {copy.isFileCopy && <Watermark text="COPY" />}
            <Header subtitle={docTitle} copyLabel={copy.label} />
            <BillTo />
            <table className="w-full text-[9.5pt] border-collapse relative z-10">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-1">#</th>
                  <th className="text-left py-1">Item</th>
                  <th className="text-right py-1 w-12">Qty</th>
                  <th className="text-right py-1 w-20">Unit</th>
                  <th className="text-right py-1 w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                {props.items.map((it, i) => (
                  <tr key={i} className="border-b border-gray-400">
                    <td className="py-1">{i + 1}</td>
                    <td className="py-1">{it.name}</td>
                    <td className="text-right py-1">{it.quantity}</td>
                    <td className="text-right py-1 font-mono">{it.unit_price.toLocaleString()}</td>
                    <td className="text-right py-1 font-mono">{it.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 flex justify-end relative z-10">
              <div className="w-56 text-[10pt] space-y-0.5">
                <div className="flex justify-between"><span>Subtotal:</span><span className="font-mono">KES {props.subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>VAT (16%):</span><span className="font-mono">KES {props.tax.toLocaleString()}</span></div>
                <div className="flex justify-between border-t-2 border-black pt-0.5 font-bold text-[12pt]">
                  <span>TOTAL:</span><span className="font-mono">KES {props.total.toLocaleString()}</span>
                </div>
              </div>
            </div>
            <div className="relative z-10"><KraFooter /></div>
          </div>
        );

        const dnLast = ++pageIndex === totalPages;
        const deliveryPage = (
          <div key={`dn-${ci}`} className="relative bg-white text-black mx-auto" style={pageStyle(dnLast)}>
            {copy.isFileCopy && <Watermark text="COPY" />}
            <Header subtitle="DELIVERY NOTE" copyLabel={copy.label} />
            <BillTo />
            <table className="w-full text-[9.5pt] border-collapse relative z-10">
              <thead>
                <tr className="border-b-2 border-black">
                  <th className="text-left py-1">#</th>
                  <th className="text-left py-1">Item Description</th>
                  <th className="text-right py-1 w-16">Qty</th>
                </tr>
              </thead>
              <tbody>
                {props.items.map((it, i) => (
                  <tr key={i} className="border-b border-gray-400">
                    <td className="py-1">{i + 1}</td>
                    <td className="py-1">{it.name}</td>
                    <td className="text-right py-1">{it.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-10 grid grid-cols-2 gap-8 text-[9pt] relative z-10">
              <div>
                <p className="border-t border-black pt-1">Delivered By (Name & Sign)</p>
                <p className="mt-6 border-t border-black pt-1">Date</p>
              </div>
              <div>
                <p className="border-t border-black pt-1">Received By (Name & Sign)</p>
                <p className="mt-6 border-t border-black pt-1">Date</p>
              </div>
            </div>
            <p className="mt-4 text-[8pt] italic relative z-10">
              Goods received in good order and condition as listed above.
            </p>
            <div className="relative z-10"><KraFooter /></div>
          </div>
        );

        return [invoicePage, deliveryPage];
      })}
    </div>
  );
}

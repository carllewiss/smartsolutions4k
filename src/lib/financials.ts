import type { GLLine } from "@/hooks/useAccounting";

export interface Period {
  from: string; // yyyy-MM-dd inclusive
  to: string; // yyyy-MM-dd inclusive
}

export interface LineItem {
  code: string;
  name: string;
  amount: number;
}

const CASH_CODES = ["1000", "1010", "1020", "1030", "1040", "1050"];

const inPeriod = (d: string, p: Period) => d >= p.from && d <= p.to;
const upTo = (d: string, to: string) => d <= to;

/** Group lines into positive-signed line items using an amount selector. */
function group(lines: GLLine[], amount: (l: GLLine) => number): LineItem[] {
  const map = new Map<string, LineItem>();
  for (const l of lines) {
    const v = amount(l);
    const cur = map.get(l.code) || { code: l.code, name: l.name, amount: 0 };
    cur.amount += v;
    map.set(l.code, cur);
  }
  return [...map.values()]
    .filter((i) => Math.abs(i.amount) > 0.0049)
    .sort((a, b) => a.code.localeCompare(b.code));
}

const sum = (items: LineItem[]) => items.reduce((s, i) => s + i.amount, 0);

/* ------------------------------- Profit & Loss ------------------------------ */
export function computePL(lines: GLLine[], p: Period) {
  const period = lines.filter((l) => l.entry_date && inPeriod(l.entry_date, p));

  const sales = group(
    period.filter((l) => l.code === "4000" || l.code === "4010"),
    (l) => l.credit - l.debit,
  );
  const otherIncome = group(
    period.filter((l) => l.type === "income" && l.code !== "4000" && l.code !== "4010"),
    (l) => l.credit - l.debit,
  );
  const cogs = group(
    period.filter((l) => l.code.startsWith("5")),
    (l) => l.debit - l.credit,
  );
  const opex = group(
    period.filter((l) => l.type === "expense" && !l.code.startsWith("5") && !l.code.startsWith("7")),
    (l) => l.debit - l.credit,
  );
  const finance = group(
    period.filter((l) => l.code.startsWith("7")),
    (l) => l.debit - l.credit,
  );

  const salesTotal = sum(sales);
  const cogsTotal = sum(cogs);
  const grossProfit = salesTotal - cogsTotal;
  const otherIncomeTotal = sum(otherIncome);
  const opexTotal = sum(opex);
  const financeTotal = sum(finance);
  const netProfit = grossProfit + otherIncomeTotal - opexTotal - financeTotal;

  return {
    sales, otherIncome, cogs, opex, finance,
    salesTotal, cogsTotal, grossProfit, otherIncomeTotal, opexTotal, financeTotal, netProfit,
  };
}

/* ----------------------------- Retained earnings ---------------------------- */
/** Cumulative net income (income - expenses) from inception up to a date. */
function cumulativeEarnings(lines: GLLine[], to: string) {
  let income = 0, expense = 0;
  for (const l of lines) {
    if (!l.entry_date || !upTo(l.entry_date, to)) continue;
    if (l.type === "income") income += l.credit - l.debit;
    else if (l.type === "expense") expense += l.debit - l.credit;
  }
  return income - expense;
}

/* ------------------------------ Balance Sheet ------------------------------- */
export function computeBalanceSheet(lines: GLLine[], asOf: string) {
  const cum = lines.filter((l) => l.entry_date && upTo(l.entry_date, asOf));

  const assets = group(cum.filter((l) => l.type === "asset"), (l) => l.debit - l.credit);
  const liabilities = group(cum.filter((l) => l.type === "liability"), (l) => l.credit - l.debit);
  const equityAccts = group(cum.filter((l) => l.type === "equity"), (l) => l.credit - l.debit);

  const currentEarnings = cumulativeEarnings(lines, asOf);
  const equity: LineItem[] = [
    ...equityAccts,
    ...(Math.abs(currentEarnings) > 0.0049
      ? [{ code: "3900", name: "Current Earnings (GL)", amount: currentEarnings }]
      : []),
  ];

  const assetsTotal = sum(assets);
  const liabilitiesTotal = sum(liabilities);
  const equityTotal = sum(equity);
  const balanced = Math.abs(assetsTotal - (liabilitiesTotal + equityTotal)) < 0.5;

  return { assets, liabilities, equity, assetsTotal, liabilitiesTotal, equityTotal, balanced };
}

/* -------------------------------- Cash Flow --------------------------------- */
export function computeCashFlow(lines: GLLine[], p: Period) {
  const cashLines = lines.filter((l) => CASH_CODES.includes(l.code) && l.entry_date);

  let opening = 0;
  for (const l of cashLines) if (l.entry_date < p.from) opening += l.debit - l.credit;

  const period = cashLines.filter((l) => inPeriod(l.entry_date, p));
  const inflow = period.reduce((s, l) => s + l.debit, 0);
  const outflow = period.reduce((s, l) => s + l.credit, 0);
  const net = inflow - outflow;
  const closing = opening + net;

  const byAccount = group(period, (l) => l.debit - l.credit);
  return { opening, inflow, outflow, net, closing, byAccount };
}

/* ------------------------------- VAT position ------------------------------- */
export function computeVat(lines: GLLine[], p: Period) {
  const period = lines.filter((l) => l.entry_date && inPeriod(l.entry_date, p));
  const outputVat = period
    .filter((l) => l.code === "2100")
    .reduce((s, l) => s + (l.credit - l.debit), 0);
  const inputVat = period
    .filter((l) => l.code === "1300")
    .reduce((s, l) => s + (l.debit - l.credit), 0);
  return { outputVat, inputVat, payable: outputVat - inputVat };
}

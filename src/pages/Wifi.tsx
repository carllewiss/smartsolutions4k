import { useMemo } from "react";
import { useWifiTransactions, useWifiVouchers, useSyncWifi } from "@/hooks/useWifi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Wifi, DollarSign, Ticket, RefreshCw, Smartphone, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays, isToday } from "date-fns";

const pkgLabel = (t?: string | null) => {
  if (!t) return "—";
  if (t === "2hour") return "2-Hour";
  if (t === "24hour") return "24-Hour";
  return t;
};

const kes = (n: number) => `KES ${Math.round(n).toLocaleString()}`;

export default function Wifi() {
  const { data: txns = [], isLoading } = useWifiTransactions();
  const { data: vouchers = [] } = useWifiVouchers();
  const sync = useSyncWifi();

  const stats = useMemo(() => {
    const today = new Date();
    const todayTx = txns.filter((t) => isToday(new Date(t.paid_at)));
    const todayRevenue = todayTx.reduce((s, t) => s + Number(t.amount), 0);
    const totalRevenue = txns.reduce((s, t) => s + Number(t.amount), 0);
    const sevenDay = txns
      .filter((t) => new Date(t.paid_at) >= subDays(today, 7))
      .reduce((s, t) => s + Number(t.amount), 0);
    const vouchersToday = vouchers.filter((v) => v.used_at && isToday(new Date(v.used_at))).length;

    const daily = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(today, 6 - i);
      const ds = format(d, "yyyy-MM-dd");
      const revenue = txns
        .filter((t) => t.paid_at?.startsWith(ds))
        .reduce((s, t) => s + Number(t.amount), 0);
      return { name: format(d, "EEE"), revenue };
    });

    return { todayRevenue, totalRevenue, sevenDay, todayCount: todayTx.length, vouchersToday, daily };
  }, [txns, vouchers]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold font-heading flex items-center gap-2">
            <Wifi className="h-6 w-6 text-primary" /> WiFi Revenue
          </h1>
          <p className="text-muted-foreground text-sm">Daily captive-portal payments, vouchers &amp; M-Pesa codes</p>
        </div>
        <Button onClick={() => sync.mutate()} disabled={sync.isPending}>
          <RefreshCw className={`h-4 w-4 mr-2 ${sync.isPending ? "animate-spin" : ""}`} />
          {sync.isPending ? "Syncing…" : "Sync now"}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Today's WiFi Revenue" value={kes(stats.todayRevenue)} sub={`${stats.todayCount} payments`} color="text-success" />
        <StatCard icon={TrendingUp} label="Last 7 Days" value={kes(stats.sevenDay)} sub="WiFi revenue" color="text-primary" />
        <StatCard icon={Ticket} label="Vouchers Today" value={String(stats.vouchersToday)} sub="assigned" color="text-warning" />
        <StatCard icon={Wifi} label="All-Time Revenue" value={kes(stats.totalRevenue)} sub={`${txns.length} payments`} color="text-primary" />
      </div>

      <Card>
        <CardHeader className="pb-2"><CardTitle className="text-base">7-Day WiFi Revenue</CardTitle></CardHeader>
        <CardContent>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.daily}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 13% 91%)" />
                <XAxis dataKey="name" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip formatter={(v: number) => kes(v)} />
                <Bar dataKey="revenue" fill="hsl(167 72% 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Smartphone className="h-4 w-4" /> WiFi Payments</CardTitle>
        </CardHeader>
        <CardContent>
          {txns.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No WiFi payments yet. Click "Sync now" to pull from the captive portal.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Phone (Paid By)</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>M-Pesa Code</TableHead>
                    <TableHead>Voucher</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {txns.slice(0, 200).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {format(new Date(t.paid_at), "dd MMM, HH:mm")}
                      </TableCell>
                      <TableCell className="font-medium">{t.phone_number || "—"}</TableCell>
                      <TableCell><Badge variant="secondary">{pkgLabel(t.package_type)}</Badge></TableCell>
                      <TableCell className="text-right font-semibold">{kes(Number(t.amount))}</TableCell>
                      <TableCell className="font-mono text-xs">{t.mpesa_receipt || "—"}</TableCell>
                      <TableCell className="font-mono text-xs">{t.voucher_code || "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2"><Ticket className="h-4 w-4" /> Voucher Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          {vouchers.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">No voucher assignments yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assigned At</TableHead>
                    <TableHead>Voucher Code</TableHead>
                    <TableHead>Package</TableHead>
                    <TableHead>Device (MAC)</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vouchers.slice(0, 200).map((v) => (
                    <TableRow key={v.id}>
                      <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                        {v.used_at ? format(new Date(v.used_at), "dd MMM, HH:mm") : "—"}
                      </TableCell>
                      <TableCell className="font-mono text-xs font-medium">{v.code || "—"}</TableCell>
                      <TableCell><Badge variant="secondary">{pkgLabel(v.package_type)}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{v.used_by_mac || "—"}</TableCell>
                      <TableCell><Badge variant={v.status === "used" ? "default" : "outline"}>{v.status || "—"}</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: { icon: any; label: string; value: string; sub: string; color: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className={`p-1.5 rounded-md bg-muted ${color}`}><Icon className="h-4 w-4" /></div>
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
        <p className="text-lg font-bold font-heading">{value}</p>
        <p className="text-xs text-muted-foreground">{sub}</p>
      </CardContent>
    </Card>
  );
}

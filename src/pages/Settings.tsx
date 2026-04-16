import { useSystemSettings, useUpdateSetting } from "@/hooks/useSystemSettings";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export default function Settings() {
  const { data: settings = {}, isLoading } = useSystemSettings();
  const updateSetting = useUpdateSetting();

  const toggle = async (key: string, current: string) => {
    const newVal = current === "true" ? "false" : "true";
    try {
      await updateSetting.mutateAsync({ key, value: newVal });
      toast.success(`${key} updated`);
    } catch (e: any) { toast.error(e.message); }
  };

  const updateValue = async (key: string, value: string) => {
    try {
      await updateSetting.mutateAsync({ key, value });
      toast.success("Saved");
    } catch (e: any) { toast.error(e.message); }
  };

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold font-heading">System Settings</h1>

      <Card>
        <CardHeader><CardTitle className="text-base">Tax & eTIMS Configuration</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">eTIMS Integration</Label>
              <p className="text-xs text-muted-foreground">When enabled, VAT is auto-calculated and KRA PIN becomes mandatory for repeat customers</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={settings.etims_enabled === "true" ? "bg-success/10 text-success" : "bg-muted text-muted-foreground"}>
                {settings.etims_enabled === "true" ? "ON" : "OFF"}
              </Badge>
              <Switch
                checked={settings.etims_enabled === "true"}
                onCheckedChange={() => toggle("etims_enabled", settings.etims_enabled || "false")}
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label className="text-xs">Default VAT Rate (%)</Label>
              <Input
                type="number"
                value={settings.default_tax_rate || "16"}
                onBlur={e => updateValue("default_tax_rate", e.target.value)}
                onChange={() => {}}
                className="w-24"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Business Information</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label className="text-xs">Business Name</Label>
            <Input
              defaultValue={settings.business_name || ""}
              onBlur={e => updateValue("business_name", e.target.value)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

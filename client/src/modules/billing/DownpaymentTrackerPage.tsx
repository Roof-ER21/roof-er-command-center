import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, Clock, CreditCard, Bell, RefreshCw } from "lucide-react";

export function DownpaymentTrackerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Downpayment Tracker</h1>
          <p className="text-muted-foreground">Aging buckets with auto-reminders and QuickBooks sync</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {["0-3 days", "4-7 days", "8-14 days", "15+ days"].map((bucket) => (
          <Card key={bucket} className="border-dashed">
            <CardHeader className="pb-2"><CardTitle className="text-sm">{bucket}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">$0</p><p className="text-xs text-muted-foreground">0 deposits</p></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4" /> Status Tracking</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Pending, Partial, Collected, Financed, Waived</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Bell className="h-4 w-4" /> Auto-Reminders</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Text/email at configurable intervals</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><RefreshCw className="h-4 w-4" /> QuickBooks Sync</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Payment logged in QB auto-updates status</p></CardContent>
        </Card>
      </div>
    </div>
  );
}

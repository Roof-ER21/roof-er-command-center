import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, BarChart3, CreditCard, Bell, RefreshCw } from "lucide-react";

export function ARTrackerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">A/R Tracker</h1>
          <p className="text-muted-foreground">Accounts receivable with aging dashboard and QuickBooks two-way sync</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {["0-30 days", "31-60 days", "61-90 days", "90+ days"].map((bucket) => (
          <Card key={bucket} className="border-dashed">
            <CardHeader className="pb-2"><CardTitle className="text-sm">{bucket}</CardTitle></CardHeader>
            <CardContent><p className="text-2xl font-bold">$0</p></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment Types</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Down payment, 2nd payment, Insurance check, Final balance, Supplement payment</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Smart Status</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">On Track, Follow-Up Needed, Overdue, Escalated, Legal</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><RefreshCw className="h-4 w-4" /> Two-Way QB Sync</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Items remain until fully resolved (paid or written off)</p></CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, DollarSign, AlertTriangle, TrendingUp, Clock } from "lucide-react";

const kpis = [
  { label: "Total Outstanding", value: "$0", icon: DollarSign, color: "text-blue-600" },
  { label: "Overdue (>30 days)", value: "$0", icon: AlertTriangle, color: "text-red-600" },
  { label: "Collected This Month", value: "$0", icon: TrendingUp, color: "text-green-600" },
  { label: "Avg Days to Collect", value: "0", icon: Clock, color: "text-amber-600" },
];

export function BillingDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing & Recovery</h1>
          <p className="text-muted-foreground">KPI dashboard with prioritized collection feed</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                {kpi.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardHeader><CardTitle className="text-sm">Priority Feed</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Cards sorted by urgency: overdue first, then high balance, then aging. Each shows Job #, customer, amount due, days outstanding, last action.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, Hammer, CalendarDays, AlertTriangle, Package } from "lucide-react";

const kpis = [
  { label: "Jobs in Production", value: "0", icon: Hammer, color: "text-blue-600" },
  { label: "Scheduled This Week", value: "0", icon: CalendarDays, color: "text-green-600" },
  { label: "Overdue Installs", value: "0", icon: AlertTriangle, color: "text-red-600" },
  { label: "Material Orders Pending", value: "0", icon: Package, color: "text-amber-600" },
];

export function ProductionDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Production Hub</h1>
          <p className="text-muted-foreground">Production pipeline with material orders, crew scheduling, and QC tracking</p>
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
            <CardContent><p className="text-2xl font-bold">{kpi.value}</p></CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardHeader><CardTitle className="text-sm">Production Status Grid</CardTitle></CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Table showing all active production jobs with stage, crew, dates, status indicators</p>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, FileCheck, Clock, Send, CheckCircle } from "lucide-react";

const kpis = [
  { label: "Total Active Supplements", value: "0", icon: FileCheck, color: "text-blue-600" },
  { label: "Pending Review", value: "0", icon: Clock, color: "text-amber-600" },
  { label: "Sent to Carrier", value: "0", icon: Send, color: "text-purple-600" },
  { label: "Finalized This Month", value: "0", icon: CheckCircle, color: "text-green-600" },
];

export function ClaimsDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Claims Center</h1>
          <p className="text-muted-foreground">Supplement tracking with carrier correspondence and stage automation</p>
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
    </div>
  );
}

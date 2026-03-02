import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, BarChart3, PieChart, LineChart, Table, Download } from "lucide-react";

export function DiagnosticsLabPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Diagnostics Lab</h1>
          <p className="text-muted-foreground">Drag-and-drop analytics dashboard with custom report builder</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Widget Types</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Bar, line, pie, donut, number card, table, funnel</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><PieChart className="h-4 w-4" /> Pre-built Reports</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Pipeline conversion, revenue by branch, production efficiency, commission accuracy, time-in-stage</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Download className="h-4 w-4" /> Export & Schedule</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">PDF, CSV, Excel export. Auto-email on schedule (daily/weekly/monthly)</p></CardContent>
        </Card>
      </div>
    </div>
  );
}

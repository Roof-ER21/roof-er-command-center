import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, Wrench, Camera, Shield, Bell } from "lucide-react";

export function PunchOutTrackerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Punch Out Tracker</h1>
          <p className="text-muted-foreground">Track punch-out items from QC inspections with warranty linking</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Wrench className="h-4 w-4" /> Status Flow</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Open → Assigned → In Progress → Complete → Verified</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Camera className="h-4 w-4" /> Before/After Photos</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Per punch-out item with trade, sub, priority, due date</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Warranty Tracking</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Link to original job, warranty period, service history</p></CardContent>
        </Card>
      </div>
    </div>
  );
}

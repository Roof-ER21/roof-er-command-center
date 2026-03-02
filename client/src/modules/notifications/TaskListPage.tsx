import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, ClipboardList, AlertTriangle, CheckCircle, Plus } from "lucide-react";

export function TaskListPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Task List</h1>
          <p className="text-muted-foreground">Auto-generated and manual tasks tied to jobs</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ClipboardList className="h-4 w-4" /> Table + Card View</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Task, Job #, Due Date, Priority, Assigned By, Status</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><AlertTriangle className="h-4 w-4" /> Auto-Generated Tasks</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Created from stage gates (e.g., "Follow Up on Carrier Estimate — due in 3 days")</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Plus className="h-4 w-4" /> Priority Levels</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Low / Medium / High / Urgent with status tracking</p></CardContent>
        </Card>
      </div>
    </div>
  );
}

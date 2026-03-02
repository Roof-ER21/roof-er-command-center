import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, Zap, GitBranch, Play, History } from "lucide-react";

export function AutomationControlPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Automation Control</h1>
          <p className="text-muted-foreground">Trigger-based automation builder: IF [trigger] AND [condition] THEN [action]</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Zap className="h-4 w-4" /> Triggers</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Stage change, time elapsed, payment received, document signed, user action</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><GitBranch className="h-4 w-4" /> Conditions</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Job type, stage, balance amount, days in stage, assigned role, branch</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Play className="h-4 w-4" /> Actions</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Create task, send notification, send email/text, move stage, assign user, create calendar event</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><History className="h-4 w-4" /> Execution Log</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Track every automation run with timestamp, trigger, outcome</p></CardContent>
        </Card>
      </div>
    </div>
  );
}

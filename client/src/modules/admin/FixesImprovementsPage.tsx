import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, Bug, Lightbulb, Wrench, CheckCircle } from "lucide-react";

const columns = [
  { name: "Backlog", icon: Lightbulb, count: 0 },
  { name: "In Progress", icon: Wrench, count: 0 },
  { name: "Testing", icon: Bug, count: 0 },
  { name: "Done", icon: CheckCircle, count: 0 },
];

export function FixesImprovementsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Fixes / Improvements</h1>
          <p className="text-muted-foreground">Internal Kanban board for bugs, features, and improvements</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {columns.map((col) => (
          <Card key={col.name} className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <col.icon className="h-4 w-4" /> {col.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{col.count}</p>
              <p className="text-xs text-muted-foreground">items</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

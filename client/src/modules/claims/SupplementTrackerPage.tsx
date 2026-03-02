import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, ArrowRight } from "lucide-react";

const stages = [
  { name: "Ready for Review", description: "Supplement assigned, awaiting supplementer", color: "bg-blue-500/10 border-blue-500/30" },
  { name: "Estimate Written", description: "Supplementer has written the estimate", color: "bg-indigo-500/10 border-indigo-500/30" },
  { name: "Sent to Carrier", description: "Estimate emailed to insurance carrier", color: "bg-purple-500/10 border-purple-500/30" },
  { name: "Follow-Up", description: "Awaiting carrier response, follow-up reminders active", color: "bg-amber-500/10 border-amber-500/30" },
  { name: "Revised Received", description: "Carrier sent revised estimate", color: "bg-orange-500/10 border-orange-500/30" },
  { name: "Uploaded / Updated", description: "Revised estimate uploaded to job", color: "bg-teal-500/10 border-teal-500/30" },
  { name: "Finalized / PIS", description: "Supplement closed — approved or denied, payment in scope", color: "bg-green-500/10 border-green-500/30" },
];

export function SupplementTrackerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Supplement Tracker</h1>
          <p className="text-muted-foreground">7-stage drag-and-drop Kanban for supplement management</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      {/* Kanban preview */}
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map((stage, i) => (
          <Card key={stage.name} className={`border-dashed min-w-[200px] flex-shrink-0 ${stage.color}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-xs flex items-center gap-1">
                <span className="font-bold">{i + 1}.</span> {stage.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{stage.description}</p>
              <Badge variant="secondary" className="mt-2 text-xs">0 items</Badge>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

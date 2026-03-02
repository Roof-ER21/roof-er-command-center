import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, CalendarDays, Paintbrush } from "lucide-react";

const eventTypes = [
  { color: "bg-green-500", label: "Installs" },
  { color: "bg-blue-500", label: "QC Inspections" },
  { color: "bg-yellow-500", label: "Project Meetings" },
  { color: "bg-red-500", label: "Overdue Items" },
  { color: "bg-purple-500", label: "Follow-ups" },
];

export function EventCalendarPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Event Calendar</h1>
          <p className="text-muted-foreground">Color-coded production calendar with Google Calendar bidirectional sync</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      <Card className="border-dashed">
        <CardHeader><CardTitle className="text-sm">Event Types</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {eventTypes.map((type) => (
              <div key={type.label} className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${type.color}`} />
                <span className="text-sm">{type.label}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-dashed h-[400px] flex items-center justify-center">
        <p className="text-muted-foreground">Calendar view with drag-to-reschedule will appear here</p>
      </Card>
    </div>
  );
}

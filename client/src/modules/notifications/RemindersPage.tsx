import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, Clock, CalendarDays, Bell, Repeat } from "lucide-react";

export function RemindersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reminders</h1>
          <p className="text-muted-foreground">Calendar and list view with snooze, recurring, and push notifications</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Calendar View</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Default calendar view with list view toggle</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Clock className="h-4 w-4" /> Snooze Options</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">1 hour, 1 day, 3 days, or custom snooze</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Repeat className="h-4 w-4" /> Recurring</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Recurring reminders linked to jobs or standalone</p></CardContent>
        </Card>
      </div>
    </div>
  );
}

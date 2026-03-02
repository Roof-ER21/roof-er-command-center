import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, MessageSquare, ClipboardList, Bell, AlertTriangle } from "lucide-react";

const summaryCards = [
  { label: "Pending Messages", icon: MessageSquare, count: 0, color: "text-blue-600" },
  { label: "Pending Tasks", icon: ClipboardList, count: 0, color: "text-amber-600" },
  { label: "Overdue Reminders", icon: AlertTriangle, count: 0, color: "text-red-600" },
  { label: "Job Alerts", icon: Bell, count: 0, color: "text-green-600" },
];

export function NotificationsDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications Hub</h1>
          <p className="text-muted-foreground">
            Centralized view of all messages, tasks, reminders, and job alerts
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.label} className="border-dashed">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                <card.icon className={`h-4 w-4 ${card.color}`} />
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{card.count}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-sm">Notification Feed</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Chronological list of all notifications — card-based, role-filtered, snooze-able
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

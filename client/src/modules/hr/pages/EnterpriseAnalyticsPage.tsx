import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MetricsResponse {
  totalEmployees: number;
  activeEmployees: number;
  pendingPTO: number;
  openPositions: number;
}

interface RecruitingAnalytics {
  totalCandidates: number;
  statusCounts: Record<string, number>;
}

export function EnterpriseAnalyticsPage() {
  const { data: metrics } = useQuery<MetricsResponse>({
    queryKey: ["/api/hr/dashboard/metrics"],
    queryFn: async () => {
      const response = await fetch("/api/hr/dashboard/metrics", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch HR metrics");
      return response.json();
    },
  });

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/tasks"],
    queryFn: async () => {
      const response = await fetch("/api/hr/tasks", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
  });

  const { data: ptoRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/pto"],
    queryFn: async () => {
      const response = await fetch("/api/hr/pto", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch PTO requests");
      return response.json();
    },
  });

  const { data: recruiting } = useQuery<RecruitingAnalytics>({
    queryKey: ["/api/hr/recruiting-analytics"],
    queryFn: async () => {
      const response = await fetch("/api/hr/recruiting-analytics", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch recruiting analytics");
      return response.json();
    },
  });

  const { data: events = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/calendar/events"],
    queryFn: async () => {
      const response = await fetch("/api/hr/calendar/events", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch calendar events");
      return response.json();
    },
  });

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== "done"),
    [tasks]
  );
  const overdueTasks = useMemo(() => {
    const now = new Date();
    return tasks.filter((task) => {
      if (!task.dueDate || task.status === "done") return false;
      return new Date(task.dueDate).getTime() < now.getTime();
    });
  }, [tasks]);

  const pendingPto = useMemo(
    () => ptoRequests.filter((request) => request.status === "pending"),
    [ptoRequests]
  );

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return events
      .filter((event) => event.startTime && new Date(event.startTime).getTime() >= now.getTime())
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 4);
  }, [events]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Enterprise Analytics</h1>
        <p className="text-muted-foreground">HR health across people, pipeline, and operations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Employees</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics?.activeEmployees ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Positions</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{metrics?.openPositions ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending PTO</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{pendingPto.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{openTasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overdue Tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overdueTasks.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Candidates</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{recruiting?.totalCandidates ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>Next HR calendar items</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{event.title}</p>
                  <p className="text-muted-foreground">
                    {new Date(event.startTime).toLocaleDateString()} • {event.location || "TBD"}
                  </p>
                </div>
                <Badge variant="outline">{event.type || "event"}</Badge>
              </div>
            ))}
            {upcomingEvents.length === 0 && (
              <p className="text-sm text-muted-foreground">No upcoming events</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>PTO Queue</CardTitle>
            <CardDescription>Requests waiting for review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {pendingPto.slice(0, 4).map((request) => (
              <div key={request.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{request.type}</p>
                  <p className="text-muted-foreground">
                    {new Date(request.startDate).toLocaleDateString()} -{" "}
                    {new Date(request.endDate).toLocaleDateString()}
                  </p>
                </div>
                <Badge variant="secondary">{request.status}</Badge>
              </div>
            ))}
            {pendingPto.length === 0 && (
              <p className="text-sm text-muted-foreground">No pending requests</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pipeline Snapshot</CardTitle>
            <CardDescription>Candidate stages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {Object.entries(recruiting?.statusCounts || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="capitalize">{status}</span>
                <span className="font-medium">{count}</span>
              </div>
            ))}
            {!recruiting && (
              <p className="text-sm text-muted-foreground">No recruiting data yet</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

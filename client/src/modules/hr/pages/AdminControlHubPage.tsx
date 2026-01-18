import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import {
  BarChart3,
  ClipboardList,
  FileText,
  ShieldCheck,
  Users,
  Wrench,
} from "lucide-react";

export function AdminControlHubPage() {
  const { data: metrics } = useQuery({
    queryKey: ["/api/hr/dashboard/metrics"],
    queryFn: async () => {
      const response = await fetch("/api/hr/dashboard/metrics", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch metrics");
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

  const { data: reports = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/scheduled-reports"],
    queryFn: async () => {
      const response = await fetch("/api/hr/scheduled-reports", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch reports");
      return response.json();
    },
  });

  const { data: documents = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/documents"],
    queryFn: async () => {
      const response = await fetch("/api/hr/documents", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    },
  });

  const { data: coiDocuments = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/coi-documents"],
    queryFn: async () => {
      const response = await fetch("/api/hr/coi-documents", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch COI documents");
      return response.json();
    },
  });

  const { data: equipment = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/equipment"],
    queryFn: async () => {
      const response = await fetch("/api/hr/equipment", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch equipment");
      return response.json();
    },
  });

  const openTasks = useMemo(() => tasks.filter((task) => task.status !== "done"), [tasks]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Control Hub</h1>
        <p className="text-muted-foreground">Executive view of HR operations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Employees</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{metrics?.totalEmployees || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{openTasks.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Scheduled Reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <span className="text-2xl font-bold">{reports.length}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Snapshot</CardTitle>
            <CardDescription>Documents and COI tracking</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                HR Documents
              </div>
              <Badge variant="outline">{documents.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-primary" />
                COI Documents
              </div>
              <Badge variant="outline">{coiDocuments.length}</Badge>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/hr/documents">Review Documents</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Operations Snapshot</CardTitle>
            <CardDescription>Equipment and task activity</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                Equipment Items
              </div>
              <Badge variant="outline">{equipment.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 text-primary" />
                Pending Tasks
              </div>
              <Badge variant="outline">{openTasks.length}</Badge>
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/hr/tasks">Review Tasks</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Jump into high-impact workflows</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to="/hr/recruiting-analytics">Recruiting Analytics</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/hr/scheduled-reports">Scheduled Reports</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/hr/susan-ai-admin">Susan AI Admin</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/training">Training Dashboard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

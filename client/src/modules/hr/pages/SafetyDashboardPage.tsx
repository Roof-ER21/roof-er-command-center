import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/useToast";
import { AlertTriangle, Clock, CheckCircle, XCircle, TrendingUp } from "lucide-react";

type SafetyIncident = {
  id: number;
  title: string;
  description: string;
  location: string | null;
  incidentDate: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'reported' | 'investigating' | 'resolved' | 'closed';
  category: 'injury' | 'near_miss' | 'property_damage' | 'environmental' | 'other' | null;
  createdAt: string;
  reporter?: { firstName: string; lastName: string };
  assignee?: { firstName: string; lastName: string };
  escalationCount: number;
};

type SafetyStats = {
  totalIncidents: number;
  openIncidents: number;
  avgResolutionTime: number | null;
  bySeverity: { severity: string; count: number }[];
  byCategory: { category: string; count: number }[];
  byMonth: { month: string; count: number }[];
};

export function SafetyDashboardPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedIncident, setSelectedIncident] = useState<SafetyIncident | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    incidentDate: new Date().toISOString().split('T')[0],
    severity: "medium" as 'low' | 'medium' | 'high' | 'critical',
    category: "other" as 'injury' | 'near_miss' | 'property_damage' | 'environmental' | 'other',
    witnesses: "",
    actionsTaken: "",
  });

  // Fetch incidents
  const { data: incidents = [] } = useQuery<SafetyIncident[]>({
    queryKey: ["/api/safety/incidents"],
    queryFn: async () => {
      const response = await fetch("/api/safety/incidents", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch incidents");
      return response.json();
    },
  });

  // Fetch stats
  const { data: stats } = useQuery<SafetyStats>({
    queryKey: ["/api/safety/stats"],
    queryFn: async () => {
      const response = await fetch("/api/safety/stats", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  // Create incident mutation
  const createIncidentMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const response = await fetch("/api/safety/incidents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create incident");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/safety/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/safety/stats"] });
      setFormData({
        title: "",
        description: "",
        location: "",
        incidentDate: new Date().toISOString().split('T')[0],
        severity: "medium",
        category: "other",
        witnesses: "",
        actionsTaken: "",
      });
      setIsCreateDialogOpen(false);
      toast({
        title: "Incident reported",
        description: "Safety incident has been logged and notifications sent.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to report incident",
        variant: "destructive",
      });
    },
  });

  // Update incident mutation
  const updateIncidentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/safety/incidents/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to update incident");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/safety/incidents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/safety/stats"] });
      toast({
        title: "Incident updated",
        description: "Incident status has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update incident",
        variant: "destructive",
      });
    },
  });

  // Filter incidents
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      if (filterSeverity !== 'all' && incident.severity !== filterSeverity) return false;
      if (filterStatus !== 'all' && incident.status !== filterStatus) return false;
      return true;
    });
  }, [incidents, filterSeverity, filterStatus]);

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'secondary';
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'reported': return 'default';
      case 'investigating': return 'default';
      case 'resolved': return 'secondary';
      case 'closed': return 'outline';
      default: return 'secondary';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast({
        title: "Missing fields",
        description: "Title and description are required.",
        variant: "destructive",
      });
      return;
    }
    createIncidentMutation.mutate(formData);
  };

  const handleStatusChange = (incidentId: number, newStatus: string) => {
    updateIncidentMutation.mutate({
      id: incidentId,
      data: { status: newStatus },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Safety Dashboard</h1>
          <p className="text-muted-foreground">Track incidents, investigations, and compliance</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <AlertTriangle className="mr-2 h-4 w-4" />
              Report Incident
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Report Safety Incident</DialogTitle>
              <DialogDescription>
                Document a safety incident for investigation and tracking
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <Label htmlFor="title">Incident Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Brief description of incident"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                    placeholder="Detailed description of what happened"
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="severity">Severity *</Label>
                  <Select
                    value={formData.severity}
                    onValueChange={(value: any) => setFormData((prev) => ({ ...prev, severity: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value: any) => setFormData((prev) => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="injury">Injury</SelectItem>
                      <SelectItem value="near_miss">Near Miss</SelectItem>
                      <SelectItem value="property_damage">Property Damage</SelectItem>
                      <SelectItem value="environmental">Environmental</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="incidentDate">Incident Date</Label>
                  <Input
                    id="incidentDate"
                    type="date"
                    value={formData.incidentDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, incidentDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                    placeholder="Where did this occur?"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="witnesses">Witnesses</Label>
                  <Input
                    id="witnesses"
                    value={formData.witnesses}
                    onChange={(e) => setFormData((prev) => ({ ...prev, witnesses: e.target.value }))}
                    placeholder="Names of any witnesses"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="actionsTaken">Actions Taken</Label>
                  <Textarea
                    id="actionsTaken"
                    value={formData.actionsTaken}
                    onChange={(e) => setFormData((prev) => ({ ...prev, actionsTaken: e.target.value }))}
                    placeholder="What immediate actions were taken?"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createIncidentMutation.isPending}>
                  {createIncidentMutation.isPending ? "Reporting..." : "Report Incident"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Incidents</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.totalIncidents || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Incidents</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{stats?.openIncidents || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Resolution Time</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {stats?.avgResolutionTime ? `${Math.round(stats.avgResolutionTime)}h` : 'N/A'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Critical/High</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-600">
              {(stats?.bySeverity.find(s => s.severity === 'critical')?.count || 0) +
                (stats?.bySeverity.find(s => s.severity === 'high')?.count || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Incidents */}
      <Tabs defaultValue="incidents" className="space-y-4">
        <TabsList>
          <TabsTrigger value="incidents">Incidents</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="incidents" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label>Severity</Label>
                  <Select value={filterSeverity} onValueChange={setFilterSeverity}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-1">
                  <Label>Status</Label>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="reported">Reported</SelectItem>
                      <SelectItem value="investigating">Investigating</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Incidents List */}
          <Card>
            <CardHeader>
              <CardTitle>Incidents ({filteredIncidents.length})</CardTitle>
              <CardDescription>All safety incidents requiring attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {filteredIncidents.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No incidents match the current filters.
                </p>
              )}
              {filteredIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="flex items-start justify-between border rounded-lg p-4 hover:bg-accent cursor-pointer"
                  onClick={() => setSelectedIncident(incident)}
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">#{incident.id} - {incident.title}</p>
                      {incident.escalationCount > 0 && (
                        <Badge variant="destructive" className="text-xs">
                          Escalated x{incident.escalationCount}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">{incident.description}</p>
                    <div className="flex gap-2 text-xs text-muted-foreground">
                      <span>
                        {incident.reporter ? `${incident.reporter.firstName} ${incident.reporter.lastName}` : 'Unknown'}
                      </span>
                      <span>•</span>
                      <span>{new Date(incident.incidentDate).toLocaleDateString()}</span>
                      {incident.location && (
                        <>
                          <span>•</span>
                          <span>{incident.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <Badge variant={getSeverityColor(incident.severity)}>
                      {incident.severity}
                    </Badge>
                    <Badge variant={getStatusColor(incident.status)}>
                      {incident.status}
                    </Badge>
                    <Select
                      value={incident.status}
                      onValueChange={(value) => handleStatusChange(incident.id, value)}
                    >
                      <SelectTrigger className="w-[140px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="reported">Reported</SelectItem>
                        <SelectItem value="investigating">Investigating</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>By Severity</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats?.bySeverity.map((item) => (
                  <div key={item.severity} className="flex items-center justify-between">
                    <span className="capitalize">{item.severity}</span>
                    <Badge>{item.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>By Category</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {stats?.byCategory.map((item) => (
                  <div key={item.category} className="flex items-center justify-between">
                    <span className="capitalize">{item.category?.replace('_', ' ') || 'Unknown'}</span>
                    <Badge>{item.count}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Trend (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats?.byMonth.map((item) => (
                <div key={item.month} className="flex items-center justify-between">
                  <span>{item.month}</span>
                  <Badge>{item.count}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

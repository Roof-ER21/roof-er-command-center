import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";

const complianceCategories = new Set(["POLICY", "PROCEDURE", "FORM"]);

export function SafetyDashboardPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
  });

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/tasks"],
    queryFn: async () => {
      const response = await fetch("/api/hr/tasks", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch tasks");
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

  const { data: documents = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/documents"],
    queryFn: async () => {
      const response = await fetch("/api/hr/documents", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    },
  });

  const createSafetyTaskMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const response = await fetch("/api/hr/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...payload,
          tags: ["safety"],
          source: "manual",
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create safety task");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/tasks"] });
      setFormData({ title: "", description: "", priority: "medium", dueDate: "" });
      toast({
        title: "Safety task created",
        description: "The safety task has been added to the queue.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create safety task",
        variant: "destructive",
      });
    },
  });

  const safetyTasks = useMemo(
    () => tasks.filter((task) => Array.isArray(task.tags) && task.tags.includes("safety")),
    [tasks]
  );

  const equipmentStatus = useMemo(() => {
    return equipment.reduce<Record<string, number>>((acc, item) => {
      acc[item.status] = (acc[item.status] || 0) + 1;
      return acc;
    }, {});
  }, [equipment]);

  const complianceDocs = useMemo(() => {
    return documents.filter((doc) => complianceCategories.has(doc.category)).slice(0, 6);
  }, [documents]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!formData.title) {
      toast({
        title: "Title required",
        description: "Add a title for the safety task.",
        variant: "destructive",
      });
      return;
    }
    createSafetyTaskMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Safety Dashboard</h1>
        <p className="text-muted-foreground">Track equipment status, compliance, and safety tasks</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Safety Tasks</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {safetyTasks.filter((task) => task.status !== "done").length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Equipment in Maintenance</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{equipmentStatus.maintenance || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Compliance Docs</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{complianceDocs.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Safety Task Queue</CardTitle>
            <CardDescription>Open issues and compliance follow-ups</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {safetyTasks.slice(0, 6).map((task) => (
              <div key={task.id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{task.title}</p>
                  <p className="text-muted-foreground">{task.description || "No description"}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{task.priority}</Badge>
                  <Badge variant="secondary">{task.status}</Badge>
                </div>
              </div>
            ))}
            {safetyTasks.length === 0 && (
              <p className="text-sm text-muted-foreground">No safety tasks logged.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Log Safety Task</CardTitle>
            <CardDescription>Add an inspection or follow-up item</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="safety-title">Title</Label>
                <Input
                  id="safety-title"
                  value={formData.title}
                  onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Roof harness inspection"
                />
              </div>
              <div>
                <Label htmlFor="safety-description">Description</Label>
                <Textarea
                  id="safety-description"
                  value={formData.description}
                  onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Add details or locations"
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="safety-priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, priority: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="safety-due">Due Date</Label>
                  <Input
                    id="safety-due"
                    type="date"
                    value={formData.dueDate}
                    onChange={(event) => setFormData((prev) => ({ ...prev, dueDate: event.target.value }))}
                  />
                </div>
              </div>
              <Button type="submit" disabled={createSafetyTaskMutation.isPending}>
                {createSafetyTaskMutation.isPending ? "Saving..." : "Add Safety Task"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Compliance Documents</CardTitle>
          <CardDescription>Latest safety-related policies and forms</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {complianceDocs.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between">
              <div>
                <p className="font-medium">{doc.name}</p>
                <p className="text-muted-foreground">{doc.category}</p>
              </div>
              <Badge variant="outline">{doc.status || "draft"}</Badge>
            </div>
          ))}
          {complianceDocs.length === 0 && (
            <p className="text-sm text-muted-foreground">No compliance docs uploaded yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

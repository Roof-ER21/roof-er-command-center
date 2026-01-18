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

const impactOptions = [
  { value: "people", label: "People Ops" },
  { value: "training", label: "Training" },
  { value: "field", label: "Field Support" },
  { value: "leaderboard", label: "Leaderboard" },
  { value: "operations", label: "Operations" },
];

export function RoadmapPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
    impact: "people",
  });

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/tasks"],
    queryFn: async () => {
      const response = await fetch("/api/hr/tasks", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
  });

  const createRoadmapMutation = useMutation({
    mutationFn: async (payload: typeof formData) => {
      const tags = ["roadmap", payload.impact].filter(Boolean);
      const response = await fetch("/api/hr/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: payload.title,
          description: payload.description,
          priority: payload.priority,
          dueDate: payload.dueDate || undefined,
          tags,
          source: payload.impact === "training" ? "training" : payload.impact === "field" ? "field" : "manual",
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create roadmap item");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/tasks"] });
      setFormData({ title: "", description: "", priority: "medium", dueDate: "", impact: "people" });
      toast({
        title: "Roadmap item created",
        description: "The initiative has been added to the roadmap.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create roadmap item",
        variant: "destructive",
      });
    },
  });

  const roadmapItems = useMemo(
    () => tasks.filter((task) => Array.isArray(task.tags) && task.tags.includes("roadmap")),
    [tasks]
  );

  const statusGroups = useMemo(() => {
    return roadmapItems.reduce<Record<string, any[]>>((acc, task) => {
      acc[task.status] = acc[task.status] || [];
      acc[task.status].push(task);
      return acc;
    }, {});
  }, [roadmapItems]);

  const sourceCounts = useMemo(() => {
    return roadmapItems.reduce<Record<string, number>>((acc, task) => {
      const source = task.source || "manual";
      acc[source] = (acc[source] || 0) + 1;
      return acc;
    }, {});
  }, [roadmapItems]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!formData.title) {
      toast({
        title: "Title required",
        description: "Name the roadmap initiative.",
        variant: "destructive",
      });
      return;
    }
    createRoadmapMutation.mutate(formData);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">HR Roadmap</h1>
        <p className="text-muted-foreground">Initiatives across HR, training, and field support</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Open Initiatives</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(statusGroups.open || []).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>In Progress</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(statusGroups.in_progress || []).length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{(statusGroups.done || []).length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Roadmap Items</CardTitle>
            <CardDescription>Planned initiatives and delivery status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {roadmapItems.slice(0, 8).map((task) => (
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
            {roadmapItems.length === 0 && (
              <p className="text-sm text-muted-foreground">No roadmap initiatives yet.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Add Initiative</CardTitle>
            <CardDescription>Create the next roadmap item</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="roadmap-title">Title</Label>
                <Input
                  id="roadmap-title"
                  value={formData.title}
                  onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                  placeholder="Quarterly onboarding refresh"
                />
              </div>
              <div>
                <Label htmlFor="roadmap-description">Description</Label>
                <Textarea
                  id="roadmap-description"
                  value={formData.description}
                  onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor="roadmap-priority">Priority</Label>
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
                  <Label htmlFor="roadmap-due">Due Date</Label>
                  <Input
                    id="roadmap-due"
                    type="date"
                    value={formData.dueDate}
                    onChange={(event) => setFormData((prev) => ({ ...prev, dueDate: event.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="roadmap-impact">Impact Area</Label>
                <Select
                  value={formData.impact}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, impact: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select impact" />
                  </SelectTrigger>
                  <SelectContent>
                    {impactOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" disabled={createRoadmapMutation.isPending}>
                {createRoadmapMutation.isPending ? "Saving..." : "Add Roadmap Item"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cross-Module Coverage</CardTitle>
          <CardDescription>Where roadmap work is focused</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          {Object.entries(sourceCounts).map(([source, count]) => (
            <div key={source} className="flex items-center justify-between">
              <span className="capitalize">{source}</span>
              <span className="font-medium">{count}</span>
            </div>
          ))}
          {Object.keys(sourceCounts).length === 0 && (
            <p className="text-sm text-muted-foreground">No roadmap coverage recorded.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { CheckCircle, ClipboardList, Plus, Search } from "lucide-react";

interface HrTask {
  id: number;
  title: string;
  description?: string;
  status: "open" | "in_progress" | "done" | "blocked";
  priority: "low" | "medium" | "high";
  assignedTo?: number | null;
  dueDate?: string | null;
  tags?: string[];
  source?: string;
  createdAt: string;
}

interface Employee {
  id: number;
  firstName?: string;
  lastName?: string;
  email: string;
}

const statusLabels: Record<HrTask["status"], string> = {
  open: "Open",
  in_progress: "In Progress",
  done: "Done",
  blocked: "Blocked",
};

const statusColors: Record<HrTask["status"], string> = {
  open: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  in_progress: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  done: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  blocked: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const priorityColors: Record<HrTask["priority"], string> = {
  low: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  medium: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200",
  high: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
};

const sourceLinks: Record<string, string> = {
  onboarding: "/hr/onboarding",
  recruiting: "/hr/recruiting",
  training: "/training",
  field: "/field",
};

export function TasksPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | HrTask["status"]>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | HrTask["priority"]>("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    priority: "medium" as HrTask["priority"],
    dueDate: "",
    tags: "",
    source: "manual",
  });

  const { data: tasks = [], isLoading } = useQuery<HrTask[]>({
    queryKey: ["/api/hr/tasks"],
    queryFn: async () => {
      const response = await fetch("/api/hr/tasks", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
  });

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/hr/employees"],
    queryFn: async () => {
      const response = await fetch("/api/hr/employees", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch employees");
      return response.json();
    },
  });

  const employeeLookup = useMemo(() => {
    return new Map(
      employees.map((employee) => [
        employee.id,
        `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || employee.email,
      ])
    );
  }, [employees]);

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/hr/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          assignedTo: formData.assignedTo || user?.id,
          priority: formData.priority,
          dueDate: formData.dueDate || null,
          tags: formData.tags
            ? formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
            : [],
          source: formData.source,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create task");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/tasks"] });
      setIsDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        assignedTo: "",
        priority: "medium",
        dueDate: "",
        tags: "",
        source: "manual",
      });
      toast({
        title: "Task created",
        description: "HR task added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create task",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: HrTask["status"] }) => {
      const response = await fetch(`/api/hr/tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to update task");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/tasks"] });
      toast({
        title: "Task updated",
        description: "Task status updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update task",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!formData.title) {
      toast({
        title: "Missing title",
        description: "Task title is required.",
        variant: "destructive",
      });
      return;
    }
    createTaskMutation.mutate();
  };

  const filteredTasks = tasks
    .filter((task) => (statusFilter === "all" ? true : task.status === statusFilter))
    .filter((task) => (priorityFilter === "all" ? true : task.priority === priorityFilter))
    .filter((task) => {
      if (!search) return true;
      const haystack = `${task.title} ${task.description || ""}`.toLowerCase();
      return haystack.includes(search.toLowerCase());
    });

  if (isLoading) {
    return <div className="p-8">Loading tasks...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Tasks</h1>
          <p className="text-muted-foreground">Track onboarding, recruiting, and operations tasks</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Create Task</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="task-title">Title</Label>
                <Input
                  id="task-title"
                  value={formData.title}
                  onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="task-description">Description</Label>
                <Textarea
                  id="task-description"
                  value={formData.description}
                  onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="task-assignee">Assigned To</Label>
                  <Select
                    value={formData.assignedTo}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, assignedTo: value }))}
                  >
                    <SelectTrigger id="task-assignee">
                      <SelectValue placeholder="Select assignee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employeeLookup.get(employee.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="task-priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, priority: value as HrTask["priority"] }))
                    }
                  >
                    <SelectTrigger id="task-priority">
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="task-due">Due Date</Label>
                  <Input
                    id="task-due"
                    type="date"
                    value={formData.dueDate}
                    onChange={(event) => setFormData((prev) => ({ ...prev, dueDate: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="task-source">Source</Label>
                  <Select
                    value={formData.source}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, source: value }))}
                  >
                    <SelectTrigger id="task-source">
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manual">Manual</SelectItem>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                      <SelectItem value="recruiting">Recruiting</SelectItem>
                      <SelectItem value="training">Training</SelectItem>
                      <SelectItem value="field">Field</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="task-tags">Tags (comma separated)</Label>
                <Input
                  id="task-tags"
                  value={formData.tags}
                  onChange={(event) => setFormData((prev) => ({ ...prev, tags: event.target.value }))}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createTaskMutation.isPending}>
                  {createTaskMutation.isPending ? "Saving..." : "Save Task"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Task Tracker</CardTitle>
          <CardDescription>{filteredTasks.length} tasks</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search tasks..."
                className="pl-9"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="done">Done</SelectItem>
                <SelectItem value="blocked">Blocked</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={priorityFilter}
              onValueChange={(value) => setPriorityFilter(value as typeof priorityFilter)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {filteredTasks.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No tasks found.
            </div>
          )}

          {filteredTasks.map((task) => (
            <div key={task.id} className="rounded-lg border p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <ClipboardList className="h-4 w-4 text-primary" />
                    <span className="font-medium">{task.title}</span>
                  </div>
                  {task.description && (
                    <div className="text-sm text-muted-foreground">{task.description}</div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Assigned to: {task.assignedTo ? employeeLookup.get(task.assignedTo) : "Unassigned"}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className={statusColors[task.status]}>{statusLabels[task.status]}</Badge>
                  <Badge className={priorityColors[task.priority]}>{task.priority}</Badge>
                  {task.source && <Badge variant="outline">{task.source}</Badge>}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                {task.dueDate && <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>}
                {task.tags && task.tags.length > 0 && (
                  <span>Tags: {task.tags.join(", ")}</span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTaskMutation.mutate({ id: task.id, status: "in_progress" })}
                  disabled={updateTaskMutation.isPending}
                >
                  Start
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateTaskMutation.mutate({ id: task.id, status: "blocked" })}
                  disabled={updateTaskMutation.isPending}
                >
                  Block
                </Button>
                <Button
                  size="sm"
                  onClick={() => updateTaskMutation.mutate({ id: task.id, status: "done" })}
                  disabled={updateTaskMutation.isPending}
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Mark Done
                </Button>
                {task.source && sourceLinks[task.source] && (
                  <Button asChild variant="outline" size="sm">
                    <Link to={sourceLinks[task.source]}>Open Module</Link>
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

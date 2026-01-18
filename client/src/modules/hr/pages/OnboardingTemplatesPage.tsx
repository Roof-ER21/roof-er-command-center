import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { usePermissions } from "@/hooks/usePermissions";
import { Layers, Plus } from "lucide-react";

interface OnboardingTemplate {
  id: number;
  name: string;
  department?: string;
  tasks: string[];
  isActive: boolean;
}

export function OnboardingTemplatesPage({ embedded = false }: { embedded?: boolean }) {
  const { toast } = useToast();
  const { isAdmin } = usePermissions();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    department: "",
    tasks: "",
  });

  const { data: templates = [], isLoading } = useQuery<OnboardingTemplate[]>({
    queryKey: ["/api/hr/onboarding-templates"],
    queryFn: async () => {
      const response = await fetch("/api/hr/onboarding-templates", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch onboarding templates");
      return response.json();
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/hr/onboarding-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          department: formData.department || null,
          tasks: formData.tasks
            ? formData.tasks.split(",").map((task) => task.trim()).filter(Boolean)
            : [],
          isActive: true,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create template");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/onboarding-templates"] });
      setIsDialogOpen(false);
      setFormData({ name: "", department: "", tasks: "" });
      toast({
        title: "Template created",
        description: "Onboarding template is ready to use.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create template",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({
        title: "Missing name",
        description: "Template name is required.",
        variant: "destructive",
      });
      return;
    }
    createTemplateMutation.mutate();
  };

  if (isLoading) {
    return <div className="p-8">Loading onboarding templates...</div>;
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Onboarding Templates</h1>
            <p className="text-muted-foreground">Reusable onboarding workflows by department</p>
          </div>
          {isAdmin() && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  New Template
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Template</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="template-name">Name</Label>
                    <Input
                      id="template-name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-dept">Department</Label>
                    <Input
                      id="template-dept"
                      value={formData.department}
                      onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="template-tasks">Tasks (comma separated)</Label>
                    <Input
                      id="template-tasks"
                      value={formData.tasks}
                      onChange={(e) => setFormData((prev) => ({ ...prev, tasks: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createTemplateMutation.isPending}>
                      {createTemplateMutation.isPending ? "Saving..." : "Create"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      )}

      {embedded && isAdmin() && (
        <div className="flex justify-end">
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Template</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="template-name">Name</Label>
                  <Input
                    id="template-name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="template-dept">Department</Label>
                  <Input
                    id="template-dept"
                    value={formData.department}
                    onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="template-tasks">Tasks (comma separated)</Label>
                  <Input
                    id="template-tasks"
                    value={formData.tasks}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tasks: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTemplateMutation.isPending}>
                    {createTemplateMutation.isPending ? "Saving..." : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>{templates.length} templates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="rounded border p-4">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-primary" />
                <span className="font-medium">{template.name}</span>
                <Badge variant="secondary">{template.department || "General"}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {template.tasks?.length ? (
                  template.tasks.map((task, index) => (
                    <Badge key={`${template.id}-${index}`} variant="outline">
                      {task}
                    </Badge>
                  ))
                ) : (
                  <span className="text-sm text-muted-foreground">No tasks defined.</span>
                )}
              </div>
            </div>
          ))}
          {templates.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No onboarding templates created yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

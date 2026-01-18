import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { usePermissions } from "@/hooks/usePermissions";
import { GitBranch, Plus, ListChecks, Trash2 } from "lucide-react";

interface WorkflowStep {
  id?: number;
  title: string;
  description?: string;
  assignedRole?: string;
}

interface Workflow {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
}

interface WorkflowDetail extends Workflow {
  steps?: Array<WorkflowStep & { stepOrder?: number }>;
}

export function WorkflowBuilderPage() {
  const { toast } = useToast();
  const { isManager } = usePermissions();
  const queryClient = useQueryClient();
  const [selectedWorkflowId, setSelectedWorkflowId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [workflowForm, setWorkflowForm] = useState({
    name: "",
    description: "",
  });
  const [stepDraft, setStepDraft] = useState<WorkflowStep>({
    title: "",
    description: "",
    assignedRole: "",
  });
  const [steps, setSteps] = useState<WorkflowStep[]>([]);

  const { data: workflows = [], isLoading } = useQuery<Workflow[]>({
    queryKey: ["/api/hr/workflows"],
    queryFn: async () => {
      const response = await fetch("/api/hr/workflows", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch workflows");
      return response.json();
    },
  });

  const { data: workflowDetail } = useQuery<WorkflowDetail | null>({
    queryKey: ["/api/hr/workflows", selectedWorkflowId],
    queryFn: async () => {
      if (!selectedWorkflowId) return null;
      const response = await fetch(`/api/hr/workflows/${selectedWorkflowId}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch workflow");
      return response.json();
    },
    enabled: !!selectedWorkflowId,
  });

  const createWorkflowMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/hr/workflows", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: workflowForm.name,
          description: workflowForm.description,
          steps,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create workflow");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/workflows"] });
      setIsDialogOpen(false);
      setWorkflowForm({ name: "", description: "" });
      setSteps([]);
      setStepDraft({ title: "", description: "", assignedRole: "" });
      toast({
        title: "Workflow created",
        description: "Workflow and steps saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create workflow",
        variant: "destructive",
      });
    },
  });

  const addStep = () => {
    if (!stepDraft.title) return;
    setSteps((prev) => [...prev, stepDraft]);
    setStepDraft({ title: "", description: "", assignedRole: "" });
  };

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, stepIndex) => stepIndex !== index));
  };

  if (isLoading) {
    return <div className="p-8">Loading workflows...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Workflow Builder</h1>
          <p className="text-muted-foreground">Design onboarding and HR workflows</p>
        </div>
        {isManager() && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Workflow</DialogTitle>
              </DialogHeader>
              <div className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="workflow-name">Workflow Name</Label>
                    <Input
                      id="workflow-name"
                      value={workflowForm.name}
                      onChange={(event) =>
                        setWorkflowForm((prev) => ({ ...prev, name: event.target.value }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="workflow-description">Description</Label>
                    <Textarea
                      id="workflow-description"
                      value={workflowForm.description}
                      onChange={(event) =>
                        setWorkflowForm((prev) => ({ ...prev, description: event.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3 rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">Workflow Steps</h3>
                      <p className="text-sm text-muted-foreground">Add steps in order.</p>
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="step-title">Step Title</Label>
                      <Input
                        id="step-title"
                        value={stepDraft.title}
                        onChange={(event) =>
                          setStepDraft((prev) => ({ ...prev, title: event.target.value }))
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="step-role">Assigned Role</Label>
                      <Input
                        id="step-role"
                        value={stepDraft.assignedRole}
                        onChange={(event) =>
                          setStepDraft((prev) => ({ ...prev, assignedRole: event.target.value }))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="step-description">Step Details</Label>
                    <Textarea
                      id="step-description"
                      value={stepDraft.description}
                      onChange={(event) =>
                        setStepDraft((prev) => ({ ...prev, description: event.target.value }))
                      }
                    />
                  </div>
                  <Button variant="outline" onClick={addStep} type="button">
                    <ListChecks className="mr-2 h-4 w-4" />
                    Add Step
                  </Button>
                  <div className="space-y-2">
                    {steps.map((step, index) => (
                      <div key={`${step.title}-${index}`} className="flex items-start justify-between gap-3 rounded border p-3">
                        <div>
                          <div className="font-medium">
                            {index + 1}. {step.title}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {step.description || "No description"}
                          </div>
                          {step.assignedRole && (
                            <div className="text-xs text-muted-foreground">
                              Role: {step.assignedRole}
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => removeStep(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    {steps.length === 0 && (
                      <p className="text-sm text-muted-foreground">No steps added yet.</p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    onClick={() => createWorkflowMutation.mutate()}
                    disabled={createWorkflowMutation.isPending || !workflowForm.name}
                  >
                    {createWorkflowMutation.isPending ? "Saving..." : "Save Workflow"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <div className="grid gap-4 lg:grid-cols-[320px,1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Workflows</CardTitle>
            <CardDescription>{workflows.length} active workflows</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {workflows.map((workflow) => (
              <button
                key={workflow.id}
                className={`w-full rounded border p-3 text-left transition ${
                  selectedWorkflowId === workflow.id ? "border-primary bg-muted/50" : "hover:bg-muted/40"
                }`}
                onClick={() => setSelectedWorkflowId(workflow.id)}
                type="button"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{workflow.name}</div>
                  <Badge variant="outline">{workflow.isActive ? "Active" : "Paused"}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  Created {new Date(workflow.createdAt).toLocaleDateString()}
                </div>
              </button>
            ))}
            {workflows.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">No workflows yet.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Workflow Details</CardTitle>
            <CardDescription>Review steps and ownership</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!workflowDetail && (
              <div className="py-8 text-center text-sm text-muted-foreground">
                Select a workflow to see details.
              </div>
            )}
            {workflowDetail && (
              <>
                <div className="flex items-center gap-3">
                  <GitBranch className="h-5 w-5 text-primary" />
                  <div>
                    <div className="font-semibold">{workflowDetail.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {workflowDetail.description || "No description provided."}
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  {(workflowDetail.steps || []).map((step, index) => (
                    <div key={`${step.title}-${index}`} className="rounded border p-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium">
                          {step.stepOrder || index + 1}. {step.title}
                        </div>
                        {step.assignedRole && <Badge variant="outline">{step.assignedRole}</Badge>}
                      </div>
                      <div className="mt-1 text-sm text-muted-foreground">
                        {step.description || "No description provided."}
                      </div>
                    </div>
                  ))}
                  {(workflowDetail.steps || []).length === 0 && (
                    <div className="rounded border border-dashed p-6 text-center text-sm text-muted-foreground">
                      No steps configured yet.
                    </div>
                  )}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

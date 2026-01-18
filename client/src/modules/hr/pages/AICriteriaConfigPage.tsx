import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { Brain, Edit, Plus, Trash2 } from "lucide-react";

interface AICriteria {
  id: number;
  name: string;
  description: string;
  criteria: string[];
  weight: number;
  isActive: boolean;
  createdAt: string;
}

export function AICriteriaConfigPage({ embedded = false }: { embedded?: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCriteria, setEditingCriteria] = useState<AICriteria | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    criteria: "",
    weight: "3",
    isActive: "true",
  });

  const { data: criteriaList = [], isLoading } = useQuery<AICriteria[]>({
    queryKey: ["/api/hr/ai-criteria"],
    queryFn: async () => {
      const response = await fetch("/api/hr/ai-criteria", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch AI criteria");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/hr/ai-criteria", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          criteria: formData.criteria,
          weight: parseInt(formData.weight, 10),
          isActive: formData.isActive === "true",
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create criteria");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/ai-criteria"] });
      setIsDialogOpen(false);
      setFormData({ name: "", description: "", criteria: "", weight: "3", isActive: "true" });
      toast({
        title: "Criteria saved",
        description: "AI criteria added.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create criteria",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/hr/ai-criteria/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          criteria: formData.criteria,
          weight: parseInt(formData.weight, 10),
          isActive: formData.isActive === "true",
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to update criteria");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/ai-criteria"] });
      setIsDialogOpen(false);
      setEditingCriteria(null);
      setFormData({ name: "", description: "", criteria: "", weight: "3", isActive: "true" });
      toast({
        title: "Criteria updated",
        description: "AI criteria updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update criteria",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/hr/ai-criteria/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to delete criteria");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/ai-criteria"] });
      toast({
        title: "Criteria deleted",
        description: "AI criteria removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete criteria",
        variant: "destructive",
      });
    },
  });

  const openEdit = (criteria: AICriteria) => {
    setEditingCriteria(criteria);
    setFormData({
      name: criteria.name,
      description: criteria.description,
      criteria: (criteria.criteria || []).join("\n"),
      weight: criteria.weight.toString(),
      isActive: criteria.isActive ? "true" : "false",
    });
    setIsDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-8">Loading AI criteria...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        {!embedded && (
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Brain className="h-6 w-6 text-primary" />
              AI Criteria Config
            </h1>
            <p className="text-muted-foreground">Define how AI evaluates recruiting candidates</p>
          </div>
        )}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Criteria
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editingCriteria ? "Edit Criteria" : "Create Criteria"}</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!formData.name || !formData.description) {
                  toast({
                    title: "Missing fields",
                    description: "Name and description are required.",
                    variant: "destructive",
                  });
                  return;
                }
                if (editingCriteria) {
                  updateMutation.mutate(editingCriteria.id);
                } else {
                  createMutation.mutate();
                }
              }}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="criteria-name">Name</Label>
                <Input
                  id="criteria-name"
                  value={formData.name}
                  onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="criteria-description">Description</Label>
                <Textarea
                  id="criteria-description"
                  value={formData.description}
                  onChange={(event) => setFormData((prev) => ({ ...prev, description: event.target.value }))}
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="criteria-lines">Criteria (one per line)</Label>
                <Textarea
                  id="criteria-lines"
                  value={formData.criteria}
                  onChange={(event) => setFormData((prev) => ({ ...prev, criteria: event.target.value }))}
                  rows={4}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="criteria-weight">Weight</Label>
                  <Select
                    value={formData.weight}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, weight: value }))}
                  >
                    <SelectTrigger id="criteria-weight">
                      <SelectValue placeholder="Weight" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((weight) => (
                        <SelectItem key={weight} value={weight.toString()}>
                          {weight}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="criteria-active">Status</Label>
                  <Select
                    value={formData.isActive}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, isActive: value }))}
                  >
                    <SelectTrigger id="criteria-active">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  type="button"
                  onClick={() => {
                    setIsDialogOpen(false);
                    setEditingCriteria(null);
                    setFormData({ name: "", description: "", criteria: "", weight: "3", isActive: "true" });
                  }}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {editingCriteria ? "Save Changes" : "Create Criteria"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Criteria Library</CardTitle>
          <CardDescription>{criteriaList.length} criteria sets</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {criteriaList.map((criteria) => (
            <div key={criteria.id} className="rounded border p-4 space-y-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium">{criteria.name}</div>
                  <div className="text-sm text-muted-foreground">{criteria.description}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={criteria.isActive ? "default" : "secondary"}>
                    {criteria.isActive ? "Active" : "Inactive"}
                  </Badge>
                  <Badge variant="outline">Weight {criteria.weight}</Badge>
                </div>
              </div>
              <div className="text-sm text-muted-foreground whitespace-pre-line">
                {criteria.criteria?.join("\n") || "No criteria listed."}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => openEdit(criteria)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteMutation.mutate(criteria.id)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))}
          {criteriaList.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No AI criteria configured yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/useToast";
import { usePermissions } from "@/hooks/usePermissions";
import { MapPin, Plus } from "lucide-react";

interface Territory {
  id: number;
  name: string;
  region: string;
  description?: string;
  isActive: boolean;
}

export function TerritoriesPage() {
  const { toast } = useToast();
  const { isAdmin } = usePermissions();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    region: "",
    description: "",
  });

  const { data: territories = [], isLoading } = useQuery<Territory[]>({
    queryKey: ["/api/hr/territories"],
    queryFn: async () => {
      const response = await fetch("/api/hr/territories", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch territories");
      return response.json();
    },
  });

  const createTerritoryMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/hr/territories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create territory");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/territories"] });
      setIsDialogOpen(false);
      setFormData({ name: "", region: "", description: "" });
      toast({
        title: "Territory added",
        description: "Territory has been created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create territory",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.region) {
      toast({
        title: "Missing fields",
        description: "Name and region are required.",
        variant: "destructive",
      });
      return;
    }
    createTerritoryMutation.mutate();
  };

  if (isLoading) {
    return <div className="p-8">Loading territories...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Territories</h1>
          <p className="text-muted-foreground">Manage sales and HR territories</p>
        </div>
        {isAdmin() && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Territory
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Territory</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="territory-name">Name</Label>
                  <Input
                    id="territory-name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="territory-region">Region</Label>
                  <Input
                    id="territory-region"
                    value={formData.region}
                    onChange={(e) => setFormData((prev) => ({ ...prev, region: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="territory-desc">Description</Label>
                  <Input
                    id="territory-desc"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createTerritoryMutation.isPending}>
                    {createTerritoryMutation.isPending ? "Saving..." : "Create"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Territory List</CardTitle>
          <CardDescription>{territories.length} territories</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {territories.map((territory) => (
            <div key={territory.id} className="flex items-center justify-between rounded border p-4">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">{territory.name}</div>
                  <div className="text-sm text-muted-foreground">{territory.region}</div>
                  {territory.description && (
                    <div className="text-sm text-muted-foreground">{territory.description}</div>
                  )}
                </div>
              </div>
              <span className="text-sm text-muted-foreground">
                {territory.isActive ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
          {territories.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No territories available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

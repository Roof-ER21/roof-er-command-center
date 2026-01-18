import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { usePermissions } from "@/hooks/usePermissions";
import { Mail, Plus } from "lucide-react";

interface EmailTemplate {
  id: number;
  name: string;
  subject: string;
  body: string;
  category: string;
  variables?: string[];
  isActive: boolean;
}

export function EmailTemplatesPage({ embedded = false }: { embedded?: boolean }) {
  const { toast } = useToast();
  const { isManager } = usePermissions();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    subject: "",
    body: "",
    category: "HR",
    variables: "",
  });

  const { data: templates = [], isLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/hr/email-templates"],
    queryFn: async () => {
      const response = await fetch("/api/hr/email-templates", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch templates");
      return response.json();
    },
  });

  const createTemplateMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/hr/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          subject: formData.subject,
          body: formData.body,
          category: formData.category,
          variables: formData.variables
            ? formData.variables.split(",").map((item) => item.trim()).filter(Boolean)
            : [],
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create template");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/email-templates"] });
      setIsDialogOpen(false);
      setFormData({ name: "", subject: "", body: "", category: "HR", variables: "" });
      toast({
        title: "Template created",
        description: "Email template saved successfully.",
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
    if (!formData.name || !formData.subject || !formData.body) {
      toast({
        title: "Missing fields",
        description: "Name, subject, and body are required.",
        variant: "destructive",
      });
      return;
    }
    createTemplateMutation.mutate();
  };

  if (isLoading) {
    return <div className="p-8">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        {!embedded && (
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Email Templates</h1>
            <p className="text-muted-foreground">Reusable templates for HR messaging</p>
          </div>
        )}
        {isManager() && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Email Template</DialogTitle>
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
                  <Label htmlFor="template-subject">Subject</Label>
                  <Input
                    id="template-subject"
                    value={formData.subject}
                    onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="template-body">Body</Label>
                  <Textarea
                    id="template-body"
                    rows={6}
                    value={formData.body}
                    onChange={(e) => setFormData((prev) => ({ ...prev, body: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="template-vars">Variables (comma separated)</Label>
                  <Input
                    id="template-vars"
                    value={formData.variables}
                    onChange={(e) => setFormData((prev) => ({ ...prev, variables: e.target.value }))}
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

      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>{templates.length} templates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {templates.map((template) => (
            <div key={template.id} className="rounded border p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-primary" />
                    <span className="font-medium">{template.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{template.subject}</div>
                  <div className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {template.body}
                  </div>
                </div>
                <Badge variant="outline">{template.category}</Badge>
              </div>
              {template.variables && template.variables.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {template.variables.map((variable) => (
                    <Badge key={variable} variant="secondary">
                      {variable}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          ))}
          {templates.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No templates yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

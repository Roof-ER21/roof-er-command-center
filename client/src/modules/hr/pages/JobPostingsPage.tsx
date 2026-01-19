import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, Eye, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import type { JobPosting } from "@shared/schema";

export function JobPostingsPage() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPosting, setEditingPosting] = useState<JobPosting | null>(null);
  const [viewingPosting, setViewingPosting] = useState<JobPosting | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    department: "",
    location: "Vienna, VA",
    employmentType: "full_time",
    description: "",
    requirements: "",
    responsibilities: "",
    salaryMin: "",
    salaryMax: "",
    salaryType: "yearly",
    status: "draft",
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: postings = [], isLoading } = useQuery<JobPosting[]>({
    queryKey: ["/api/hr/job-postings", statusFilter],
    queryFn: async () => {
      const url = statusFilter === 'all'
        ? '/api/hr/job-postings'
        : `/api/hr/job-postings?status=${statusFilter}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch job postings");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/hr/job-postings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create job posting");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/job-postings"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Job posting created", description: "The job posting has been added." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to create job posting", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const response = await fetch(`/api/hr/job-postings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to update job posting");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/job-postings"] });
      setIsDialogOpen(false);
      resetForm();
      toast({ title: "Job posting updated", description: "Changes have been saved." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to update job posting", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/hr/job-postings/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to delete job posting");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/job-postings"] });
      toast({ title: "Job posting deleted", description: "The job posting has been removed." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to delete job posting", variant: "destructive" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/hr/job-postings/${id}/publish`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to publish job posting");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/job-postings"] });
      toast({ title: "Job posting published", description: "The job posting is now active." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to publish job posting", variant: "destructive" });
    },
  });

  const closeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/hr/job-postings/${id}/close`, {
        method: "POST",
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to close job posting");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/job-postings"] });
      toast({ title: "Job posting closed", description: "The job posting is no longer active." });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error?.message || "Failed to close job posting", variant: "destructive" });
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      department: "",
      location: "Vienna, VA",
      employmentType: "full_time",
      description: "",
      requirements: "",
      responsibilities: "",
      salaryMin: "",
      salaryMax: "",
      salaryType: "yearly",
      status: "draft",
    });
    setEditingPosting(null);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.department) {
      toast({ title: "Missing fields", description: "Title and department are required.", variant: "destructive" });
      return;
    }
    if (editingPosting) {
      updateMutation.mutate({ id: editingPosting.id, data: formData });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEdit = (posting: JobPosting) => {
    setEditingPosting(posting);
    setFormData({
      title: posting.title,
      department: posting.department,
      location: posting.location || "Vienna, VA",
      employmentType: posting.employmentType || "full_time",
      description: posting.description || "",
      requirements: posting.requirements || "",
      responsibilities: posting.responsibilities || "",
      salaryMin: posting.salaryMin ? posting.salaryMin.toString() : "",
      salaryMax: posting.salaryMax ? posting.salaryMax.toString() : "",
      salaryType: posting.salaryType || "yearly",
      status: posting.status || "draft",
    });
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Active</Badge>;
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'paused':
        return <Badge className="bg-yellow-500">Paused</Badge>;
      case 'closed':
        return <Badge variant="secondary">Closed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatSalary = (posting: JobPosting) => {
    if (!posting.salaryMin && !posting.salaryMax) return "Not specified";
    const type = posting.salaryType || "yearly";
    const typeLabel = type === "yearly" ? "/year" : type === "hourly" ? "/hour" : "";
    if (posting.salaryMin && posting.salaryMax) {
      return `$${posting.salaryMin.toLocaleString()} - $${posting.salaryMax.toLocaleString()}${typeLabel}`;
    }
    if (posting.salaryMin) {
      return `From $${posting.salaryMin.toLocaleString()}${typeLabel}`;
    }
    return `Up to $${posting.salaryMax!.toLocaleString()}${typeLabel}`;
  };

  const filteredPostings = postings;

  if (isLoading) {
    return <div className="p-8">Loading job postings...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Job Postings</h1>
          <p className="text-muted-foreground">Manage open positions and hiring</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Create Posting
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto max-w-3xl">
            <DialogHeader>
              <DialogTitle>{editingPosting ? "Edit Job Posting" : "Create Job Posting"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="title">Job Title</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Senior Sales Representative"
                  />
                </div>
                <div>
                  <Label htmlFor="department">Department</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData((prev) => ({ ...prev, department: e.target.value }))}
                    placeholder="e.g., Sales"
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="employmentType">Employment Type</Label>
                  <Select
                    value={formData.employmentType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, employmentType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_time">Full-time</SelectItem>
                      <SelectItem value="part_time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Job overview and company culture..."
                />
              </div>
              <div>
                <Label htmlFor="requirements">Requirements (one per line)</Label>
                <Textarea
                  id="requirements"
                  rows={4}
                  value={formData.requirements}
                  onChange={(e) => setFormData((prev) => ({ ...prev, requirements: e.target.value }))}
                  placeholder="- 3+ years of sales experience&#10;- Proven track record of hitting targets&#10;- Excellent communication skills"
                />
              </div>
              <div>
                <Label htmlFor="responsibilities">Responsibilities (one per line)</Label>
                <Textarea
                  id="responsibilities"
                  rows={4}
                  value={formData.responsibilities}
                  onChange={(e) => setFormData((prev) => ({ ...prev, responsibilities: e.target.value }))}
                  placeholder="- Manage client relationships&#10;- Meet monthly sales quotas&#10;- Present proposals to decision-makers"
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="salaryMin">Minimum Salary</Label>
                  <Input
                    id="salaryMin"
                    type="number"
                    value={formData.salaryMin}
                    onChange={(e) => setFormData((prev) => ({ ...prev, salaryMin: e.target.value }))}
                    placeholder="50000"
                  />
                </div>
                <div>
                  <Label htmlFor="salaryMax">Maximum Salary</Label>
                  <Input
                    id="salaryMax"
                    type="number"
                    value={formData.salaryMax}
                    onChange={(e) => setFormData((prev) => ({ ...prev, salaryMax: e.target.value }))}
                    placeholder="80000"
                  />
                </div>
                <div>
                  <Label htmlFor="salaryType">Salary Type</Label>
                  <Select
                    value={formData.salaryType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, salaryType: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yearly">Yearly</SelectItem>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="commission">Commission</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="paused">Paused</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => handleDialogChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                  {createMutation.isPending || updateMutation.isPending
                    ? "Saving..."
                    : editingPosting
                      ? "Update Posting"
                      : "Create Posting"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredPostings.map((posting) => (
          <Card key={posting.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{posting.title}</CardTitle>
                  <CardDescription>{posting.department} • {posting.location}</CardDescription>
                </div>
                {getStatusBadge(posting.status || 'draft')}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Employment Type:</span>
                  <span className="capitalize">{posting.employmentType?.replace('_', '-')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Salary Range:</span>
                  <span>{formatSalary(posting)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Posted:</span>
                  <span>{new Date(posting.createdAt).toLocaleDateString()}</span>
                </div>
              </div>

              {posting.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">{posting.description}</p>
              )}

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm" onClick={() => setViewingPosting(posting)}>
                  <Eye className="mr-1 h-3 w-3" />
                  View
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleEdit(posting)}>
                  <Pencil className="mr-1 h-3 w-3" />
                  Edit
                </Button>
                {posting.status === 'draft' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => publishMutation.mutate(posting.id)}
                    disabled={publishMutation.isPending}
                  >
                    <CheckCircle className="mr-1 h-3 w-3" />
                    Publish
                  </Button>
                )}
                {posting.status === 'active' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => closeMutation.mutate(posting.id)}
                    disabled={closeMutation.isPending}
                  >
                    <XCircle className="mr-1 h-3 w-3" />
                    Close
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    if (confirm("Are you sure you want to delete this job posting?")) {
                      deleteMutation.mutate(posting.id);
                    }
                  }}
                >
                  <Trash2 className="mr-1 h-3 w-3" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredPostings.length === 0 && (
          <div className="col-span-full py-12 text-center text-muted-foreground">
            No job postings found. Create your first posting to get started.
          </div>
        )}
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewingPosting} onOpenChange={(open) => !open && setViewingPosting(null)}>
        <DialogContent className="max-h-[85vh] overflow-y-auto max-w-3xl">
          <DialogHeader>
            <DialogTitle>{viewingPosting?.title}</DialogTitle>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{viewingPosting?.department}</span>
              <span>•</span>
              <span>{viewingPosting?.location}</span>
              <span>•</span>
              <span className="capitalize">{viewingPosting?.employmentType?.replace('_', '-')}</span>
            </div>
          </DialogHeader>
          {viewingPosting && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Salary Range</h3>
                <p>{formatSalary(viewingPosting)}</p>
              </div>
              {viewingPosting.description && (
                <div>
                  <h3 className="font-semibold mb-2">Description</h3>
                  <p className="text-sm whitespace-pre-wrap">{viewingPosting.description}</p>
                </div>
              )}
              {viewingPosting.requirements && (
                <div>
                  <h3 className="font-semibold mb-2">Requirements</h3>
                  <div className="text-sm whitespace-pre-wrap">{viewingPosting.requirements}</div>
                </div>
              )}
              {viewingPosting.responsibilities && (
                <div>
                  <h3 className="font-semibold mb-2">Responsibilities</h3>
                  <div className="text-sm whitespace-pre-wrap">{viewingPosting.responsibilities}</div>
                </div>
              )}
              <div className="flex justify-between text-sm text-muted-foreground pt-4 border-t">
                <span>Status: {getStatusBadge(viewingPosting.status || 'draft')}</span>
                <span>Posted: {new Date(viewingPosting.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

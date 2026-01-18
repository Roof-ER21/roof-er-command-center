import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { usePermissions } from "@/hooks/usePermissions";
import { Star } from "lucide-react";

interface Review {
  id: number;
  employeeId: number;
  reviewerId?: number;
  periodStart?: string;
  periodEnd?: string;
  rating?: number;
  summary?: string;
  status: "draft" | "submitted" | "completed";
  employeeName?: string;
  reviewerName?: string;
  createdAt: string;
}

export function ReviewsPage() {
  const { toast } = useToast();
  const { isManager } = usePermissions();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    periodStart: "",
    periodEnd: "",
    rating: "",
    summary: "",
    status: "draft",
  });

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ["/api/hr/reviews"],
    queryFn: async () => {
      const response = await fetch("/api/hr/reviews", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch reviews");
      return response.json();
    },
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/employees"],
    queryFn: async () => {
      const response = await fetch("/api/hr/employees", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch employees");
      return response.json();
    },
  });

  const createReviewMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/hr/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          employeeId: formData.employeeId,
          periodStart: formData.periodStart,
          periodEnd: formData.periodEnd,
          rating: formData.rating ? parseInt(formData.rating, 10) : null,
          summary: formData.summary,
          status: formData.status,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create review");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/reviews"] });
      setIsDialogOpen(false);
      setFormData({
        employeeId: "",
        periodStart: "",
        periodEnd: "",
        rating: "",
        summary: "",
        status: "draft",
      });
      toast({
        title: "Review created",
        description: "Performance review has been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create review",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.employeeId) {
      toast({
        title: "Missing employee",
        description: "Select an employee for the review.",
        variant: "destructive",
      });
      return;
    }
    createReviewMutation.mutate();
  };

  if (isLoading) {
    return <div className="p-8">Loading reviews...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Performance Reviews</h1>
          <p className="text-muted-foreground">Track employee evaluations and feedback</p>
        </div>
        {isManager() && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>Create Review</Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>New Review</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Employee</Label>
                  <Select
                    value={formData.employeeId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, employeeId: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.firstName} {employee.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label htmlFor="periodStart">Period Start</Label>
                    <Input
                      id="periodStart"
                      type="date"
                      value={formData.periodStart}
                      onChange={(e) => setFormData((prev) => ({ ...prev, periodStart: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="periodEnd">Period End</Label>
                    <Input
                      id="periodEnd"
                      type="date"
                      value={formData.periodEnd}
                      onChange={(e) => setFormData((prev) => ({ ...prev, periodEnd: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label>Rating (1-5)</Label>
                  <Select
                    value={formData.rating}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, rating: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <SelectItem key={rating} value={rating.toString()}>
                          {rating} Star{rating === 1 ? "" : "s"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="summary">Summary</Label>
                  <Input
                    id="summary"
                    value={formData.summary}
                    onChange={(e) => setFormData((prev) => ({ ...prev, summary: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createReviewMutation.isPending}>
                    {createReviewMutation.isPending ? "Saving..." : "Save Review"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Reviews</CardTitle>
          <CardDescription>{reviews.length} reviews total</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <div className="font-medium">{review.employeeName || "Employee"}</div>
                <div className="text-sm text-muted-foreground">
                  Reviewer: {review.reviewerName || "Unassigned"}
                </div>
                {review.summary && (
                  <div className="mt-1 text-sm text-muted-foreground">{review.summary}</div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{review.status}</Badge>
                <div className="flex items-center gap-1 text-sm">
                  <Star className="h-4 w-4 text-amber-500" />
                  {review.rating || "N/A"}
                </div>
              </div>
            </div>
          ))}
          {reviews.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No reviews yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

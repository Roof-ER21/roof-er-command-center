import { useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { usePermissions } from "@/hooks/usePermissions";
import { UserPlus, UserCheck } from "lucide-react";

interface EmployeeAssignment {
  id: number;
  employeeId: number;
  managerId: number | null;
  assignmentType: "PRIMARY" | "SECONDARY";
  createdAt: string;
}

interface Employee {
  id: number;
  firstName?: string;
  lastName?: string;
  email: string;
  role?: string;
  department?: string;
  position?: string;
}

export function EmployeeAssignmentsPage() {
  const { toast } = useToast();
  const { isManager } = usePermissions();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: "",
    managerId: "none",
    assignmentType: "PRIMARY" as EmployeeAssignment["assignmentType"],
  });

  const { data: assignments = [], isLoading } = useQuery<EmployeeAssignment[]>({
    queryKey: ["/api/hr/employee-assignments"],
    queryFn: async () => {
      const response = await fetch("/api/hr/employee-assignments", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch assignments");
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

  const createAssignmentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/hr/employee-assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          employeeId: formData.employeeId,
          managerId: formData.managerId === "none" ? null : formData.managerId,
          assignmentType: formData.assignmentType,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create assignment");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/employee-assignments"] });
      setIsDialogOpen(false);
      setFormData({ employeeId: "", managerId: "none", assignmentType: "PRIMARY" });
      toast({
        title: "Assignment created",
        description: "Employee reporting line updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create assignment",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!formData.employeeId) {
      toast({
        title: "Missing employee",
        description: "Select an employee to assign.",
        variant: "destructive",
      });
      return;
    }
    createAssignmentMutation.mutate();
  };

  if (isLoading) {
    return <div className="p-8">Loading assignments...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Assignments</h1>
          <p className="text-muted-foreground">Track reporting lines and managers</p>
        </div>
        {isManager() && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                New Assignment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Assignment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="assignment-employee">Employee</Label>
                  <Select
                    value={formData.employeeId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, employeeId: value }))}
                  >
                    <SelectTrigger id="assignment-employee">
                      <SelectValue placeholder="Select employee" />
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
                  <Label htmlFor="assignment-manager">Manager</Label>
                  <Select
                    value={formData.managerId}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, managerId: value }))}
                  >
                    <SelectTrigger id="assignment-manager">
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employeeLookup.get(employee.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="assignment-type">Assignment Type</Label>
                  <Select
                    value={formData.assignmentType}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        assignmentType: value as EmployeeAssignment["assignmentType"],
                      }))
                    }
                  >
                    <SelectTrigger id="assignment-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRIMARY">Primary</SelectItem>
                      <SelectItem value="SECONDARY">Secondary</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createAssignmentMutation.isPending}>
                    {createAssignmentMutation.isPending ? "Saving..." : "Save Assignment"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Current Assignments</CardTitle>
          <CardDescription>{assignments.length} assignments tracked</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {assignments.map((assignment) => (
            <div key={assignment.id} className="rounded border p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {employeeLookup.get(assignment.employeeId) || "Unknown employee"}
                  </span>
                </div>
                <Badge variant="outline">{assignment.assignmentType}</Badge>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                Manager: {assignment.managerId ? employeeLookup.get(assignment.managerId) : "Unassigned"}
              </div>
              <div className="text-xs text-muted-foreground">
                Assigned {new Date(assignment.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
          {assignments.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No assignments yet.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Users, CalendarCheck } from "lucide-react";

interface Employee {
  id: number;
  firstName?: string;
  lastName?: string;
  email: string;
  department?: string;
  position?: string;
}

interface PtoRequest {
  id: number;
  employeeId: number;
  startDate: string;
  endDate: string;
  type: string;
  status: string;
  reason?: string;
}

export function TeamDashboardPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const isManager =
    !!user?.role &&
    [
      "SYSTEM_ADMIN",
      "HR_ADMIN",
      "GENERAL_MANAGER",
      "TERRITORY_MANAGER",
      "MANAGER",
    ].includes(user.role);

  const { data: employees = [] } = useQuery<Employee[]>({
    queryKey: ["/api/hr/employees"],
    queryFn: async () => {
      const response = await fetch("/api/hr/employees", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch employees");
      return response.json();
    },
  });

  const { data: ptoRequests = [] } = useQuery<PtoRequest[]>({
    queryKey: ["/api/hr/pto"],
    queryFn: async () => {
      const response = await fetch("/api/hr/pto", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch PTO");
      return response.json();
    },
  });

  const pendingPto = useMemo(
    () => ptoRequests.filter((request) => request.status === "pending"),
    [ptoRequests]
  );

  const employeeLookup = useMemo(() => {
    return new Map(
      employees.map((employee) => [
        employee.id,
        `${employee.firstName || ""} ${employee.lastName || ""}`.trim() || employee.email,
      ])
    );
  }, [employees]);

  const updatePtoMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "APPROVED" | "DENIED" }) => {
      const response = await fetch(`/api/hr/pto/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to update PTO request");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/pto"] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Dashboard</h1>
        <p className="text-muted-foreground">Manage your team, PTO, and coverage</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Team Members
            </CardTitle>
            <CardDescription>{employees.length} active employees</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {employees.map((employee) => (
              <div key={employee.id} className="rounded border p-3 text-sm">
                <div className="font-medium">
                  {employee.firstName} {employee.lastName}
                </div>
                <div className="text-xs text-muted-foreground">
                  {employee.position || "Role not set"} • {employee.department || "Department not set"}
                </div>
              </div>
            ))}
            {employees.length === 0 && (
              <div className="text-sm text-muted-foreground">No team members found.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Pending PTO Requests
            </CardTitle>
            <CardDescription>{pendingPto.length} awaiting review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingPto.map((request) => (
              <div key={request.id} className="rounded border p-3 text-sm space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{employeeLookup.get(request.employeeId)}</div>
                  <Badge variant="outline">{request.type}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">
                  {request.startDate} - {request.endDate}
                </div>
                {request.reason && <div className="text-xs text-muted-foreground">{request.reason}</div>}
                {isManager ? (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => updatePtoMutation.mutate({ id: request.id, status: "APPROVED" })}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updatePtoMutation.mutate({ id: request.id, status: "DENIED" })}
                    >
                      Deny
                    </Button>
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">Manager approval required.</div>
                )}
              </div>
            ))}
            {pendingPto.length === 0 && (
              <div className="text-sm text-muted-foreground">No pending PTO requests.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

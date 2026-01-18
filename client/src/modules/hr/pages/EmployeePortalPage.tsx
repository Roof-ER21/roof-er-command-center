import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import { CalendarCheck, ClipboardList, FileText, UserCircle } from "lucide-react";

interface HRDocument {
  id: number;
  name: string;
  category: string;
  status: string;
  createdAt: string;
}

interface Meeting {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  status: string;
}

interface EmployeeAssignment {
  id: number;
  employeeId: number;
  managerId: number | null;
  assignmentType: "PRIMARY" | "SECONDARY";
  createdAt: string;
}

interface EmployeeProfile {
  id: number;
  firstName?: string;
  lastName?: string;
  email: string;
  department?: string;
  position?: string;
}

export function EmployeePortalPage() {
  const { user } = useAuth();

  const { data: assignments = [] } = useQuery<EmployeeAssignment[]>({
    queryKey: ["/api/hr/employee-assignments"],
    queryFn: async () => {
      const response = await fetch("/api/hr/employee-assignments", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch assignments");
      return response.json();
    },
  });

  const { data: documents = [] } = useQuery<HRDocument[]>({
    queryKey: ["/api/hr/documents"],
    queryFn: async () => {
      const response = await fetch("/api/hr/documents", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch documents");
      return response.json();
    },
  });

  const { data: meetings = [] } = useQuery<Meeting[]>({
    queryKey: ["/api/hr/meetings"],
    queryFn: async () => {
      const response = await fetch("/api/hr/meetings", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch meetings");
      return response.json();
    },
  });

  const { data: employees = [] } = useQuery<EmployeeProfile[]>({
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

  const myAssignments = assignments.filter((assignment) => assignment.employeeId === user?.id);
  const primaryManager = myAssignments.find((assignment) => assignment.assignmentType === "PRIMARY")?.managerId;
  const managerName = primaryManager ? employeeLookup.get(primaryManager) : "Not assigned";

  const recentDocuments = documents.slice(0, 5);
  const upcomingMeetings = [...meetings]
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Employee Portal</h1>
        <p className="text-muted-foreground">Your HR snapshot and quick actions</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCircle className="h-5 w-5 text-primary" />
              My Profile
            </CardTitle>
            <CardDescription>Basic employment details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div className="font-medium">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-muted-foreground">{user?.email}</div>
            <div className="text-muted-foreground">
              {user?.department || "Department not set"} • {user?.position || "Position not set"}
            </div>
            <div className="text-muted-foreground">Manager: {managerName}</div>
            <Button asChild size="sm" className="mt-2">
              <Link to="/hr/profile">Update Profile</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
            <CardDescription>Common HR workflows</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button asChild variant="outline">
              <Link to="/hr/pto">Request PTO</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/hr/documents">Review Documents</Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/training">Training Portal</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-primary" />
              Assignments
            </CardTitle>
            <CardDescription>Your reporting line</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {myAssignments.map((assignment) => (
              <div key={assignment.id} className="rounded border p-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{assignment.assignmentType.toLowerCase()}</span>
                  <Badge variant="outline">{new Date(assignment.createdAt).toLocaleDateString()}</Badge>
                </div>
                <div className="text-muted-foreground">
                  Manager: {assignment.managerId ? employeeLookup.get(assignment.managerId) : "Unassigned"}
                </div>
              </div>
            ))}
            {myAssignments.length === 0 && (
              <div className="text-sm text-muted-foreground">No assignment data available.</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Recent Documents
            </CardTitle>
            <CardDescription>Latest HR documents</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentDocuments.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between rounded border p-3 text-sm">
                <div>
                  <div className="font-medium">{doc.name}</div>
                  <div className="text-xs text-muted-foreground">{doc.category}</div>
                </div>
                <Badge variant="outline">{doc.status}</Badge>
              </div>
            ))}
            {recentDocuments.length === 0 && (
              <div className="text-sm text-muted-foreground">No documents available.</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarCheck className="h-5 w-5 text-primary" />
              Upcoming Meetings
            </CardTitle>
            <CardDescription>Next scheduled meetings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {upcomingMeetings.map((meeting) => (
              <div key={meeting.id} className="flex items-center justify-between rounded border p-3 text-sm">
                <div>
                  <div className="font-medium">{meeting.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(meeting.startTime).toLocaleString()} - {new Date(meeting.endTime).toLocaleString()}
                  </div>
                </div>
                <Badge variant="outline">{meeting.status}</Badge>
              </div>
            ))}
            {upcomingMeetings.length === 0 && (
              <div className="text-sm text-muted-foreground">No meetings scheduled.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

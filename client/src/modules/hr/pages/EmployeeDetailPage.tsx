import { useMemo, useState } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Briefcase, Calendar, Mail, MapPin, Package, Phone, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeNotes } from "../components/EmployeeNotes";

export function EmployeeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const employeeId = id ? parseInt(id, 10) : null;
  
  const tabFromQuery = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabFromQuery || "activity");

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams({ tab: value }, { replace: true });
  };

  const { data: employee, isLoading } = useQuery<any>({
    queryKey: ["/api/hr/employees", employeeId],
    queryFn: async () => {
      const response = await fetch(`/api/hr/employees/${employeeId}`, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch employee");
      return response.json();
    },
    enabled: !!employeeId,
  });

  const { data: ptoRequests = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/pto"],
    queryFn: async () => {
      const response = await fetch("/api/hr/pto", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch PTO requests");
      return response.json();
    },
    enabled: !!employeeId,
  });

  const { data: contracts = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/contracts"],
    queryFn: async () => {
      const response = await fetch("/api/hr/contracts", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch contracts");
      return response.json();
    },
    enabled: !!employeeId,
  });

  const { data: tasks = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/tasks"],
    queryFn: async () => {
      const response = await fetch("/api/hr/tasks", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch tasks");
      return response.json();
    },
    enabled: !!employeeId,
  });

  const { data: equipmentItems = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/equipment"],
    queryFn: async () => {
      const response = await fetch("/api/hr/equipment", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch equipment");
      return response.json();
    },
    enabled: !!employeeId,
  });

  const employeePto = useMemo(
    () => ptoRequests.filter((request) => request.employeeId === employeeId),
    [ptoRequests, employeeId]
  );

  const employeeContracts = useMemo(
    () => contracts.filter((contract) => contract.employeeId === employeeId),
    [contracts, employeeId]
  );

  const assignedTasks = useMemo(
    () => tasks.filter((task) => task.assignedTo === employeeId),
    [tasks, employeeId]
  );

  const assignedEquipment = useMemo(
    () => equipmentItems.filter((item) => item.assignedTo === employeeId),
    [equipmentItems, employeeId]
  );

  if (isLoading) {
    return <div className="p-8">Loading employee...</div>;
  }

  if (!employeeId || !employee) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/hr/employees")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employees
        </Button>
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Employee not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const initials = `${employee.firstName?.[0] || ""}${employee.lastName?.[0] || ""}`.toUpperCase();
  const statusLabel = employee.isActive ? "active" : "inactive";

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header Section */}
      <div className="flex flex-col gap-6">
        <Button variant="ghost" className="w-fit" onClick={() => navigate("/hr/employees")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Employees
        </Button>

        <Card>
          <CardHeader>
            <div className="flex items-start gap-6">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-3xl">
                    {employee.firstName} {employee.lastName}
                  </CardTitle>
                  <Badge variant={employee.isActive ? "default" : "secondary"}>
                    {statusLabel}
                  </Badge>
                </div>
                <CardDescription className="text-base mb-4">
                  {employee.role?.replace(/_/g, " ") || "Employee"} • {employee.department || "General"}
                </CardDescription>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>{employee.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>{employee.phone || "No phone"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{employee.address || "No address"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Hired: {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : "N/A"}</span>
                  </div>
                </div>
              </div>
              <Button asChild variant="outline">
                <Link to="/hr/employees">Manage Employee</Link>
              </Button>
            </div>
          </CardHeader>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs value={activeTab} onValueChange={handleTabChange} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start border-b rounded-none bg-transparent p-0 mb-6">
          <TabsTrigger 
            value="activity" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
          >
            Activity & Performance
          </TabsTrigger>
          <TabsTrigger 
            value="notes" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
          >
            Notes & History
          </TabsTrigger>
          <TabsTrigger 
            value="documents" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
          >
            Documents
          </TabsTrigger>
          <TabsTrigger 
            value="tasks" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
          >
            Tasks
          </TabsTrigger>
          <TabsTrigger 
            value="equipment" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-2"
          >
            Equipment
          </TabsTrigger>
        </TabsList>

        <div className="flex-1">
          <TabsContent value="activity" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>Performance Snapshot</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-muted/20 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Training Level</p>
                      <p className="text-xl font-semibold capitalize">{employee.trainingLevel || 'Beginner'}</p>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Total XP</p>
                      <p className="text-xl font-semibold">{employee.totalXp || 0}</p>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Current Streak</p>
                      <p className="text-xl font-semibold">{employee.currentStreak || 0} days</p>
                    </div>
                    <div className="p-4 bg-muted/20 rounded-lg">
                      <p className="text-xs text-muted-foreground mb-1">Open Tasks</p>
                      <p className="text-xl font-semibold">{assignedTasks.filter(t => t.status !== 'done').length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activity / PTO */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent PTO</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {employeePto.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium text-sm">{request.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={request.status === 'APPROVED' ? 'default' : 'secondary'}>
                          {request.status}
                        </Badge>
                      </div>
                    ))}
                    {employeePto.length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">No recent time off</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="notes" className="h-[600px] mt-0">
            <EmployeeNotes employeeId={employeeId} />
          </TabsContent>

          <TabsContent value="documents" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Contracts & Documents</CardTitle>
                <CardDescription>Employee contracts and signed documents</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {employeeContracts.map((contract) => (
                    <div key={contract.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/5 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{contract.title}</p>
                          <p className="text-xs text-muted-foreground">
                            Sent: {new Date(contract.sentDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{contract.status}</Badge>
                        <Button size="sm" variant="ghost">View</Button>
                      </div>
                    </div>
                  ))}
                  {employeeContracts.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No documents found for this employee</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="tasks" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Assigned Tasks</CardTitle>
                <CardDescription>Tasks assigned to this employee</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignedTasks.map((task) => (
                    <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <p className="font-medium">{task.title}</p>
                        <p className="text-xs text-muted-foreground">{task.description}</p>
                      </div>
                      <Badge variant={task.status === 'done' ? 'default' : 'secondary'}>
                        {task.status}
                      </Badge>
                    </div>
                  ))}
                  {assignedTasks.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No active tasks</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipment" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Equipment Inventory</CardTitle>
                <CardDescription>Items currently assigned to this employee</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {assignedEquipment.map((item) => (
                    <div key={item.id} className="p-4 border rounded-lg flex items-start gap-3">
                      <div className="h-10 w-10 bg-muted rounded-lg flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="font-medium">{item.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">{item.serialNumber || 'No Serial #'}</p>
                        <Badge variant="outline" className="text-xs">{item.status}</Badge>
                      </div>
                    </div>
                  ))}
                  {assignedEquipment.length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>No equipment assigned</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
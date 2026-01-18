import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Calendar, ChevronLeft, ChevronRight, Search, Clock } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { usePermissions } from "@/hooks/usePermissions";
import { useAuth } from "@/hooks/useAuth";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useSearchParams } from "react-router-dom";
import { PtoPoliciesPage } from "@/modules/hr/pages/PtoPoliciesPage";
import { PtoAnalyticsPage } from "@/modules/hr/pages/PtoAnalyticsPage";

interface PTORequest {
  id: number;
  employeeId: number;
  startDate: string;
  endDate: string;
  days: number;
  type: "VACATION" | "SICK" | "PERSONAL";
  reason: string;
  status: "pending" | "approved" | "denied";
  createdAt: string;
}

export function PTOPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "approved" | "denied">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [formData, setFormData] = useState({
    startDate: "",
    endDate: "",
    type: "VACATION",
    reason: "",
    employeeId: "",
  });
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { isManager } = usePermissions();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const tabFromQuery = searchParams.get("tab");
  const tabFromPath = location.pathname.includes("pto-policies") ? "policy" : "requests";
  const resolvedTab = tabFromQuery || tabFromPath;
  const [activeTab, setActiveTab] = useState(resolvedTab);

  useEffect(() => {
    setActiveTab(resolvedTab);
  }, [resolvedTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const onBasePath = location.pathname === "/hr/pto";
    if (value === "requests" && onBasePath) {
      setSearchParams({}, { replace: true });
      return;
    }
    setSearchParams({ tab: value }, { replace: true });
  };

  const { data: ptoRequests = [], isLoading } = useQuery<PTORequest[]>({
    queryKey: ["/api/hr/pto"],
    queryFn: async () => {
      const response = await fetch("/api/hr/pto", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch PTO requests");
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

  const { data: myBalance } = useQuery<any>({
    queryKey: ["/api/hr/pto/policies/employee", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const res = await fetch(`/api/hr/pto/policies/employee/${user?.id}`, { credentials: "include" });
      if (!res.ok) return null;
      return res.json();
    }
  });

  const employeeLookup = useMemo(() => {
    return new Map(
      employees.map((emp: any) => [
        emp.id,
        `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.email,
      ])
    );
  }, [employees]);

  const toLocalDate = (value: string) => new Date(`${value}T00:00:00`);
  const formatDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const createRequestMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = {
        ...data,
        employeeId: isManager() ? data.employeeId || undefined : undefined,
      };
      const response = await fetch("/api/hr/pto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to submit PTO request");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/pto"] });
      setIsDialogOpen(false);
      setFormData({ startDate: "", endDate: "", type: "VACATION", reason: "", employeeId: "" });
      toast({
        title: "Request submitted",
        description: "Your PTO request has been submitted for review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to submit request",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: "approved" | "denied" | "pending" }) => {
      const response = await fetch(`/api/hr/pto/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to update PTO status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/pto"] });
      toast({
        title: "PTO updated",
        description: "Request status updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update PTO status",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.startDate || !formData.endDate || !formData.reason) {
      toast({
        title: "Missing fields",
        description: "Please provide dates and a reason.",
        variant: "destructive",
      });
      return;
    }
    const start = toLocalDate(formData.startDate);
    const end = toLocalDate(formData.endDate);
    if (end.getTime() < start.getTime()) {
      toast({
        title: "Invalid date range",
        description: "End date must be after the start date.",
        variant: "destructive",
      });
      return;
    }
    createRequestMutation.mutate(formData);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "denied":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    }
  };

  const visibleRequests = isManager()
    ? ptoRequests
    : ptoRequests.filter(
        (request) => request.employeeId === user?.id
      );

  const selectedEmployeeId = isManager()
    ? formData.employeeId
      ? Number(formData.employeeId)
      : user?.id
    : user?.id;

  const overlappingRequests = useMemo(() => {
    if (!formData.startDate || !formData.endDate || !selectedEmployeeId) return [];
    const start = toLocalDate(formData.startDate);
    const end = toLocalDate(formData.endDate);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
    return visibleRequests.filter((request) => {
      const requestUserId = (request as PTORequest & { userId?: number }).userId;
      const ownerId = request.employeeId ?? requestUserId;
      if (ownerId !== selectedEmployeeId) return false;
      if (request.status === "denied") return false;
      const requestStart = toLocalDate(request.startDate);
      const requestEnd = toLocalDate(request.endDate);
      return start.getTime() <= requestEnd.getTime() && end.getTime() >= requestStart.getTime();
    });
  }, [formData.startDate, formData.endDate, selectedEmployeeId, visibleRequests]);

  const filteredRequests = visibleRequests
    .filter((request) => {
      if (statusFilter === "all") return true;
      return request.status === statusFilter;
    })
    .filter((request) => {
      if (!searchTerm) return true;
      const employeeName = employeeLookup.get(request.employeeId)?.toLowerCase() || "";
      return employeeName.includes(searchTerm.toLowerCase());
    });

  const pendingCount = visibleRequests.filter((r) => r.status === "pending").length;
  const approvedCount = visibleRequests.filter((r) => r.status === "approved").length;
  const deniedCount = visibleRequests.filter((r) => r.status === "denied").length;
  const now = new Date();
  const upcomingApproved = visibleRequests
    .filter((r) => r.status === "approved")
    .filter((r) => {
      const start = new Date(r.startDate);
      if (Number.isNaN(start.getTime())) return false;
      const diffDays = (start.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays >= 0 && diffDays <= 30;
    })
    .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
    .slice(0, 5);

  const calendarMonthLabel = calendarMonth.toLocaleString("default", {
    month: "long",
    year: "numeric",
  });
  const calendarStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const calendarEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
  const calendarDays = Array.from({ length: calendarEnd.getDate() }, (_, index) => {
    return new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), index + 1);
  });
  const calendarRequestMap = useMemo(() => {
    const map = new Map<string, PTORequest[]>();
    visibleRequests.forEach((request) => {
      const start = toLocalDate(request.startDate);
      const end = toLocalDate(request.endDate);
      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return;
      for (
        let day = new Date(start.getFullYear(), start.getMonth(), start.getDate());
        day.getTime() <= end.getTime();
        day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)
      ) {
        const key = formatDateKey(day);
        const bucket = map.get(key) || [];
        bucket.push(request);
        map.set(key, bucket);
      }
    });
    return map;
  }, [visibleRequests]);

  if (isLoading) {
    return <div className="p-8">Loading PTO requests...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Time Off</h1>
        <p className="text-muted-foreground">Review and manage time off requests</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTrigger value="requests">Requests</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="policy">Policy</TabsTrigger>
          </TabsList>
          {activeTab === "requests" && (
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Calendar className="mr-2 h-4 w-4" />
                  Request Time Off
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Request Time Off</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  {isManager() && (
                    <div>
                      <Label htmlFor="employee">Request For</Label>
                      <Select
                        value={formData.employeeId || "self"}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            employeeId: value === "self" ? "" : value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select employee" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="self">Myself</SelectItem>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              {employee.firstName} {employee.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="startDate">Start Date</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, startDate: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="endDate">End Date</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, endDate: e.target.value }))}
                    />
                  </div>
                  {overlappingRequests.length > 0 && (
                    <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                      <p className="font-medium">Potential overlap detected</p>
                      <p className="text-xs text-amber-800">
                        {overlappingRequests.length} existing request
                        {overlappingRequests.length > 1 ? "s" : ""} overlap this range.
                      </p>
                    </div>
                  )}
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Select
                      value={formData.type}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VACATION">Vacation</SelectItem>
                        <SelectItem value="SICK">Sick</SelectItem>
                        <SelectItem value="PERSONAL">Personal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="reason">Reason</Label>
                    <Input
                      id="reason"
                      placeholder="Brief reason"
                      value={formData.reason}
                      onChange={(e) => setFormData((prev) => ({ ...prev, reason: e.target.value }))}
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createRequestMutation.isPending}>
                      {createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <TabsContent value="requests" className="space-y-6">
          {myBalance && (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Your PTO Balance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Vacation</p>
                    <p className="text-xl font-bold">{myBalance.vacationDays}d</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Sick</p>
                    <p className="text-xl font-bold">{myBalance.sickDays}d</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-semibold">Personal</p>
                    <p className="text-xl font-bold">{myBalance.personalDays}d</p>
                  </div>
                  <div className="border-l pl-4">
                    <p className="text-xs text-muted-foreground uppercase font-semibold text-primary">Remaining</p>
                    <p className="text-2xl font-bold text-primary">{myBalance.remainingDays}d</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Pending</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Approved</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{approvedCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Denied</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{deniedCount}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Upcoming Approved PTO</CardTitle>
              <CardDescription>Next 30 days of approved time off</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {upcomingApproved.map((request) => (
                <div key={request.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">
                      {employeeLookup.get(request.employeeId) || "Unknown"}
                    </p>
                    <p className="text-muted-foreground">
                      {new Date(request.startDate).toLocaleDateString()} -{" "}
                      {new Date(request.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="outline">{request.type}</Badge>
                </div>
              ))}
              {upcomingApproved.length === 0 && (
                <p className="text-sm text-muted-foreground">No upcoming approved PTO.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Requests</CardTitle>
              <CardDescription>
                {isManager() ? "All team requests" : "Your submitted requests"}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search by employee name..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
                >
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Filter status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="denied">Denied</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-sm font-medium">Employee</th>
                  <th className="text-left py-2 text-sm font-medium">Dates</th>
                  <th className="text-left py-2 text-sm font-medium">Days</th>
                  <th className="text-left py-2 text-sm font-medium">Type</th>
                  <th className="text-left py-2 text-sm font-medium">Reason</th>
                  <th className="text-left py-2 text-sm font-medium">Status</th>
                  {isManager() && <th className="text-left py-2 text-sm font-medium">Actions</th>}
                </tr>
              </thead>
              <tbody>
                    {filteredRequests.map((request) => (
                      <tr key={request.id} className="border-b">
                        <td className="py-3">
                          <div className="text-sm font-medium">
                            {employeeLookup.get(request.employeeId) || "Unknown"}
                          </div>
                        </td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {new Date(request.startDate).toLocaleDateString()} -{" "}
                          {new Date(request.endDate).toLocaleDateString()}
                        </td>
                        <td className="py-3 text-sm">{request.days}</td>
                        <td className="py-3 text-sm">{request.type}</td>
                        <td className="py-3 text-sm text-muted-foreground">
                          {request.reason || "—"}
                        </td>
                        <td className="py-3">
                          <Badge className={getStatusColor(request.status)}>
                            {request.status}
                          </Badge>
                        </td>
                        {isManager() && (
                          <td className="py-3">
                            {request.status === "pending" ? (
                              <div className="flex flex-wrap gap-2">
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updateStatusMutation.isPending}
                                  onClick={() => updateStatusMutation.mutate({ id: request.id, status: "approved" })}
                                >
                                  Approve
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  disabled={updateStatusMutation.isPending}
                                  onClick={() => updateStatusMutation.mutate({ id: request.id, status: "denied" })}
                                >
                                  Deny
                                </Button>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">Reviewed</span>
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                    {filteredRequests.length === 0 && (
                      <tr>
                        <td colSpan={isManager() ? 7 : 6} className="py-6 text-center text-sm text-muted-foreground">
                          No requests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle>PTO Calendar</CardTitle>
                <CardDescription>Team availability for {calendarMonthLabel}</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1)
                    )
                  }
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCalendarMonth(
                      new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1)
                    )
                  }
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-2 text-xs font-medium text-muted-foreground">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((label) => (
                  <div key={label} className="text-center">
                    {label}
                  </div>
                ))}
              </div>
              <div className="mt-2 grid grid-cols-7 gap-2">
                {Array.from({ length: calendarStart.getDay() }).map((_, index) => (
                  <div key={`empty-${index}`} className="min-h-[96px]" />
                ))}
                {calendarDays.map((day) => {
                  const dayKey = formatDateKey(day);
                  const dayRequests = calendarRequestMap.get(dayKey) || [];
                  const approved = dayRequests.filter((request) => request.status === "approved").length;
                  const pending = dayRequests.filter((request) => request.status === "pending").length;
                  const denied = dayRequests.filter((request) => request.status === "denied").length;
                  return (
                    <div
                      key={dayKey}
                      className={`min-h-[96px] rounded-lg border p-2 ${
                        dayRequests.length > 0 ? "bg-muted/30" : "bg-background"
                      }`}
                    >
                      <div className="text-sm font-semibold">{day.getDate()}</div>
                      {dayRequests.length > 0 ? (
                        <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                          {approved > 0 && <div className="text-green-700">Approved {approved}</div>}
                          {pending > 0 && <div className="text-amber-700">Pending {pending}</div>}
                          {denied > 0 && <div className="text-red-700">Denied {denied}</div>}
                        </div>
                      ) : (
                        <div className="mt-2 text-[11px] text-muted-foreground">No PTO</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <PtoAnalyticsPage embedded />
        </TabsContent>

        <TabsContent value="policy">
          <PtoPoliciesPage embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}

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
import { CalendarClock, FileText, Plus, RefreshCw } from "lucide-react";

type ScheduleFrequency = "daily" | "weekly" | "monthly";

interface ScheduledReport {
  id: number;
  name: string;
  reportType: string;
  format: string;
  recipients: string[];
  filters: Record<string, any>;
  schedule: string;
  isActive: boolean;
  lastRunAt?: string | null;
  nextRunAt?: string | null;
  createdAt: string;
}

const REPORT_TYPES = [
  { value: "RECRUITING", label: "Recruiting" },
  { value: "PTO", label: "PTO" },
  { value: "ATTENDANCE", label: "Attendance" },
  { value: "PERFORMANCE", label: "Performance" },
  { value: "EMPLOYEES", label: "Employees" },
  { value: "TRAINING", label: "Training" },
  { value: "FIELD", label: "Field" },
];

const FORMATS = [
  { value: "PDF", label: "PDF" },
  { value: "CSV", label: "CSV" },
  { value: "EXCEL", label: "Excel" },
];

const DAYS_OF_WEEK = [
  { value: "MON", label: "Monday" },
  { value: "TUE", label: "Tuesday" },
  { value: "WED", label: "Wednesday" },
  { value: "THU", label: "Thursday" },
  { value: "FRI", label: "Friday" },
  { value: "SAT", label: "Saturday" },
  { value: "SUN", label: "Sunday" },
];

const buildCronExpression = (config: {
  frequency: ScheduleFrequency;
  time: string;
  dayOfWeek?: string;
  dayOfMonth?: string;
}) => {
  const [hour, minute] = config.time.split(":");

  switch (config.frequency) {
    case "daily":
      return `${minute} ${hour} * * *`;
    case "weekly":
      return `${minute} ${hour} * * ${config.dayOfWeek || "MON"}`;
    case "monthly":
      return `${minute} ${hour} ${config.dayOfMonth || "1"} * *`;
    default:
      return `${minute} ${hour} * * *`;
  }
};

const parseCronExpression = (cron: string) => {
  const parts = cron.split(" ");
  const [minute, hour, dayOfMonth, , dayOfWeek] = parts;
  const time = `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;

  if (dayOfWeek !== "*") {
    return { frequency: "weekly" as const, time, dayOfWeek };
  }
  if (dayOfMonth !== "*") {
    return { frequency: "monthly" as const, time, dayOfMonth };
  }
  return { frequency: "daily" as const, time };
};

const formatSchedule = (cron: string) => {
  const parsed = parseCronExpression(cron);
  if (parsed.frequency === "weekly") {
    const label = DAYS_OF_WEEK.find((day) => day.value === parsed.dayOfWeek)?.label || parsed.dayOfWeek;
    return `Weekly on ${label} at ${parsed.time}`;
  }
  if (parsed.frequency === "monthly") {
    return `Monthly on day ${parsed.dayOfMonth} at ${parsed.time}`;
  }
  return `Daily at ${parsed.time}`;
};

export function ScheduledReportsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    reportType: "RECRUITING",
    format: "PDF",
    recipients: "",
    filters: "{}",
    scheduleFrequency: "daily" as ScheduleFrequency,
    scheduleTime: "09:00",
    scheduleDayOfWeek: "MON",
    scheduleDayOfMonth: "1",
    isActive: "true",
  });

  const { data: reports = [], isLoading } = useQuery<ScheduledReport[]>({
    queryKey: ["/api/hr/scheduled-reports"],
    queryFn: async () => {
      const response = await fetch("/api/hr/scheduled-reports", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch scheduled reports");
      return response.json();
    },
  });

  const createReportMutation = useMutation({
    mutationFn: async () => {
      const schedule = buildCronExpression({
        frequency: formData.scheduleFrequency,
        time: formData.scheduleTime,
        dayOfWeek: formData.scheduleDayOfWeek,
        dayOfMonth: formData.scheduleDayOfMonth,
      });

      const response = await fetch("/api/hr/scheduled-reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: formData.name,
          reportType: formData.reportType,
          format: formData.format,
          recipients: formData.recipients,
          filters: formData.filters,
          schedule,
          isActive: formData.isActive === "true",
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create report");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/scheduled-reports"] });
      setIsDialogOpen(false);
      setFormData({
        name: "",
        reportType: "RECRUITING",
        format: "PDF",
        recipients: "",
        filters: "{}",
        scheduleFrequency: "daily",
        scheduleTime: "09:00",
        scheduleDayOfWeek: "MON",
        scheduleDayOfMonth: "1",
        isActive: "true",
      });
      toast({
        title: "Report scheduled",
        description: "Report schedule saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create report",
        variant: "destructive",
      });
    },
  });

  const toggleReportMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/hr/scheduled-reports/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to update report");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/scheduled-reports"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update report",
        variant: "destructive",
      });
    },
  });

  const runReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const response = await fetch(`/api/hr/scheduled-reports/${reportId}/executions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status: "success" }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to record execution");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Run logged",
        description: "Execution entry created.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to log execution",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="p-8">Loading scheduled reports...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Scheduled Reports</h1>
          <p className="text-muted-foreground">Automate HR reporting and delivery</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Report
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create Scheduled Report</DialogTitle>
            </DialogHeader>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                if (!formData.name) {
                  toast({
                    title: "Missing name",
                    description: "Report name is required.",
                    variant: "destructive",
                  });
                  return;
                }
                createReportMutation.mutate();
              }}
              className="space-y-4"
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="report-name">Report Name</Label>
                  <Input
                    id="report-name"
                    value={formData.name}
                    onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="report-type">Report Type</Label>
                  <Select
                    value={formData.reportType}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, reportType: value }))}
                  >
                    <SelectTrigger id="report-type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {REPORT_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="report-format">Format</Label>
                  <Select
                    value={formData.format}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, format: value }))}
                  >
                    <SelectTrigger id="report-format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      {FORMATS.map((format) => (
                        <SelectItem key={format.value} value={format.value}>
                          {format.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="report-active">Active</Label>
                  <Select
                    value={formData.isActive}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, isActive: value }))}
                  >
                    <SelectTrigger id="report-active">
                      <SelectValue placeholder="Active" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Paused</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="report-recipients">Recipients (comma separated)</Label>
                <Input
                  id="report-recipients"
                  value={formData.recipients}
                  onChange={(event) => setFormData((prev) => ({ ...prev, recipients: event.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="report-filters">Filters (JSON)</Label>
                <Textarea
                  id="report-filters"
                  value={formData.filters}
                  onChange={(event) => setFormData((prev) => ({ ...prev, filters: event.target.value }))}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label htmlFor="report-frequency">Frequency</Label>
                  <Select
                    value={formData.scheduleFrequency}
                    onValueChange={(value) =>
                      setFormData((prev) => ({ ...prev, scheduleFrequency: value as ScheduleFrequency }))
                    }
                  >
                    <SelectTrigger id="report-frequency">
                      <SelectValue placeholder="Frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="report-time">Time</Label>
                  <Input
                    id="report-time"
                    type="time"
                    value={formData.scheduleTime}
                    onChange={(event) => setFormData((prev) => ({ ...prev, scheduleTime: event.target.value }))}
                  />
                </div>
                {formData.scheduleFrequency === "weekly" && (
                  <div>
                    <Label htmlFor="report-day">Day of Week</Label>
                    <Select
                      value={formData.scheduleDayOfWeek}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, scheduleDayOfWeek: value }))
                      }
                    >
                      <SelectTrigger id="report-day">
                        <SelectValue placeholder="Day" />
                      </SelectTrigger>
                      <SelectContent>
                        {DAYS_OF_WEEK.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                {formData.scheduleFrequency === "monthly" && (
                  <div>
                    <Label htmlFor="report-month-day">Day of Month</Label>
                    <Input
                      id="report-month-day"
                      type="number"
                      min={1}
                      max={31}
                      value={formData.scheduleDayOfMonth}
                      onChange={(event) =>
                        setFormData((prev) => ({ ...prev, scheduleDayOfMonth: event.target.value }))
                      }
                    />
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createReportMutation.isPending}>
                  {createReportMutation.isPending ? "Saving..." : "Save Report"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Report Schedule</CardTitle>
          <CardDescription>{reports.length} scheduled reports</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {reports.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">No reports scheduled.</div>
          )}
          {reports.map((report) => (
            <div key={report.id} className="rounded border p-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="font-medium">{report.name}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">{report.reportType}</div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{report.format}</Badge>
                  <Badge variant={report.isActive ? "default" : "secondary"}>
                    {report.isActive ? "Active" : "Paused"}
                  </Badge>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CalendarClock className="h-4 w-4" />
                  {formatSchedule(report.schedule)}
                </div>
                {report.nextRunAt && <span>Next run: {new Date(report.nextRunAt).toLocaleString()}</span>}
                {report.lastRunAt && <span>Last run: {new Date(report.lastRunAt).toLocaleString()}</span>}
              </div>
              <div className="text-xs text-muted-foreground">
                Recipients: {report.recipients?.join(", ") || "None"}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => toggleReportMutation.mutate({ id: report.id, isActive: !report.isActive })}
                >
                  {report.isActive ? "Pause" : "Activate"}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => runReportMutation.mutate(report.id)}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Log Run
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

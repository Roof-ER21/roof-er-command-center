import { useEffect, useState, type FormEvent, type DragEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarClock, Pencil, Search, UserPlus, Eye } from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { useLocation, useSearchParams } from "react-router-dom";
import { RecruitingAnalyticsPage } from "@/modules/hr/pages/RecruitingAnalyticsPage";
import { ResumeUploaderPage } from "@/modules/hr/pages/ResumeUploaderPage";
import { AICriteriaConfigPage } from "@/modules/hr/pages/AICriteriaConfigPage";
import { CandidateDetailsDialog } from "./components/CandidateDetailsDialog";
import type { Candidate } from "@shared/schema";

interface EmployeeOption {
  id: number;
  firstName: string;
  lastName: string;
}

interface Interview {
  id: number;
  candidateId: number;
  interviewerId?: number | null;
  scheduledAt: string;
  duration?: number | null;
  type: "phone" | "video" | "in_person" | "panel";
  status: "scheduled" | "completed" | "cancelled" | "no_show";
  location?: string | null;
  meetingLink?: string | null;
  rating?: number | null;
  notes?: string | null;
  feedback?: string | null;
  recommendation?: string | null;
  candidateName?: string;
  candidatePosition?: string;
  interviewerName?: string;
}

export function RecruitingPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [archiveFilter, setArchiveFilter] = useState<"active" | "archived" | "all">("active");
  const [pipelineView, setPipelineView] = useState<"table" | "kanban">("table");
  const [selectedCandidateIds, setSelectedCandidateIds] = useState<Set<number>>(new Set());
  const [bulkStatus, setBulkStatus] = useState("");
  const [bulkAssignee, setBulkAssignee] = useState("unassigned");
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [interviewSearch, setInterviewSearch] = useState("");
  const [interviewStatusFilter, setInterviewStatusFilter] = useState("all");
  const [isInterviewDialogOpen, setIsInterviewDialogOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState<Interview | null>(null);
  const [selectedCandidateForDetails, setSelectedCandidateForDetails] = useState<Candidate | null>(null);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    position: "",
    status: "new",
    source: "",
    resumeUrl: "",
    rating: "",
    notes: "",
    assignedTo: "",
  });
  const [interviewForm, setInterviewForm] = useState({
    candidateId: "",
    interviewerId: "",
    scheduledAt: "",
    duration: "60",
    type: "video",
    status: "scheduled",
    location: "",
    meetingLink: "",
    notes: "",
  });
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tabFromQuery = searchParams.get("tab");
  const tabFromPath = location.pathname.includes("recruiting-analytics")
    ? "analytics"
    : location.pathname.includes("resume-uploader")
      ? "resumes"
      : location.pathname.includes("ai-criteria")
        ? "criteria"
        : "pipeline";
  const resolvedTab = tabFromQuery || tabFromPath;
  const [activeTab, setActiveTab] = useState(resolvedTab);

  useEffect(() => {
    setActiveTab(resolvedTab);
  }, [resolvedTab]);

  useEffect(() => {
    if (pipelineView === "kanban") {
      setStatusFilter("all");
    }
  }, [pipelineView]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const onBasePath = location.pathname === "/hr/recruiting";
    if (value === "pipeline" && onBasePath) {
      setSearchParams({}, { replace: true });
      return;
    }
    setSearchParams({ tab: value }, { replace: true });
  };

  const statusColumns: Candidate["status"][] = [
    "new",
    "screening",
    "interview",
    "offer",
    "hired",
    "rejected",
  ];

  const handleDragStart = (candidateId: number) => (event: DragEvent<HTMLDivElement>) => {
    event.dataTransfer.setData("text/plain", candidateId.toString());
  };

  const handleDrop = (status: Candidate["status"]) => (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    const payload = event.dataTransfer.getData("text/plain");
    const candidateId = parseInt(payload, 10);
    if (Number.isNaN(candidateId)) return;
    quickUpdateMutation.mutate({ id: candidateId, data: { status } });
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
  };

  const includeArchived = archiveFilter !== "active";
  const { data: candidates = [], isLoading } = useQuery<Candidate[]>({
    queryKey: ["/api/hr/candidates", includeArchived],
    queryFn: async () => {
      const response = await fetch(`/api/hr/candidates?includeArchived=${includeArchived}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch candidates");
      return response.json();
    },
  });

  const { data: employees = [] } = useQuery<EmployeeOption[]>({
    queryKey: ["/api/hr/employees", "includeInactive"],
    queryFn: async () => {
      const response = await fetch("/api/hr/employees?includeInactive=true", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch employees");
      return response.json();
    },
  });

  const { data: interviews = [] } = useQuery<Interview[]>({
    queryKey: ["/api/hr/interviews"],
    queryFn: async () => {
      const response = await fetch("/api/hr/interviews", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch interviews");
      return response.json();
    },
  });

  const buildCandidatePayload = (data: Partial<typeof formData>) => {
    const payload: Record<string, any> = {
      ...data,
    };
    if ("rating" in data) {
      payload.rating = data.rating ? Number(data.rating) : null;
    }
    if ("assignedTo" in data) {
      payload.assignedTo = data.assignedTo ? Number(data.assignedTo) : null;
    }
    if ("resumeUrl" in data) {
      payload.resumeUrl = data.resumeUrl || null;
    }
    if ("notes" in data) {
      payload.notes = data.notes || null;
    }
    return payload;
  };

  const bulkUpdateMutation = useMutation({
    mutationFn: async (payload: {
      candidateIds: number[];
      status?: string;
      assignedTo?: string | number | null;
      rating?: string | number | null;
      archive?: boolean;
    }) => {
      const response = await fetch("/api/hr/candidates/bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to update candidates");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/candidates"] });
      setSelectedCandidateIds(new Set());
      setBulkStatus("");
      setBulkAssignee("unassigned");
      toast({
        title: "Bulk update complete",
        description: "Selected candidates updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update candidates",
        variant: "destructive",
      });
    },
  });

  const createCandidateMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const payload = buildCandidatePayload(data);
      const response = await fetch("/api/hr/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create candidate");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/candidates"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Candidate added",
        description: "The candidate has been added to the pipeline.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to add candidate",
        variant: "destructive",
      });
    },
  });

  const updateCandidateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof formData }) => {
      const payload = buildCandidatePayload(data);
      const response = await fetch(`/api/hr/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to update candidate");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/candidates"] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Candidate updated",
        description: "Candidate details have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update candidate",
        variant: "destructive",
      });
    },
  });

  const quickUpdateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      const payload = buildCandidatePayload(data);
      const response = await fetch(`/api/hr/candidates/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to update candidate");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/candidates"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update candidate",
        variant: "destructive",
      });
    },
  });

  const createInterviewMutation = useMutation({
    mutationFn: async (data: typeof interviewForm) => {
      const response = await fetch("/api/hr/interviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          duration: data.duration ? Number(data.duration) : undefined,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to schedule interview");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/interviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/candidates"] });
      resetInterviewForm();
      setIsInterviewDialogOpen(false);
      toast({
        title: "Interview scheduled",
        description: "Interview has been added to the calendar.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to schedule interview",
        variant: "destructive",
      });
    },
  });

  const updateInterviewMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof interviewForm }) => {
      const response = await fetch(`/api/hr/interviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          duration: data.duration ? Number(data.duration) : undefined,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to update interview");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/interviews"] });
      resetInterviewForm();
      setEditingInterview(null);
      setIsInterviewDialogOpen(false);
      toast({
        title: "Interview updated",
        description: "Interview details have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update interview",
        variant: "destructive",
      });
    },
  });

  const quickInterviewStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: Interview["status"] }) => {
      const response = await fetch(`/api/hr/interviews/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to update interview status");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/interviews"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update interview status",
        variant: "destructive",
      });
    },
  });

  const employeeLookup = new Map(
    employees.map((employee) => [employee.id, `${employee.firstName} ${employee.lastName}`])
  );

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      position: "",
      status: "new",
      source: "",
      resumeUrl: "",
      rating: "",
      notes: "",
      assignedTo: "",
    });
    setEditingCandidate(null);
  };

  const resetInterviewForm = () => {
    setInterviewForm({
      candidateId: "",
      interviewerId: "",
      scheduledAt: "",
      duration: "60",
      type: "video",
      status: "scheduled",
      location: "",
      meetingLink: "",
      notes: "",
    });
    setEditingInterview(null);
  };

  const statusCandidates = candidates.filter((candidate) => {
    const isArchived = Boolean(candidate.isArchived);
    if (archiveFilter === "all") return true;
    if (archiveFilter === "archived") return isArchived;
    return !isArchived;
  });

  const filteredCandidates = statusCandidates.filter((candidate) => {
    const assignedName = candidate.assignedTo ? employeeLookup.get(candidate.assignedTo) : "";
    const searchValue = `${candidate.firstName} ${candidate.lastName} ${candidate.email} ${candidate.position} ${candidate.status} ${assignedName || ""}`.toLowerCase();
    const matchesSearch = !searchTerm || searchValue.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || candidate.status === statusFilter;
    const matchesAssignee =
      assigneeFilter === "all" ||
      (assigneeFilter === "unassigned"
        ? !candidate.assignedTo
        : candidate.assignedTo?.toString() === assigneeFilter);
    return matchesSearch && matchesStatus && matchesAssignee;
  });

  const selectedCandidates = candidates.filter((candidate) => selectedCandidateIds.has(candidate.id));
  const comparisonCandidates = selectedCandidates.slice(0, 4);
  const selectedVisibleCount = filteredCandidates.filter((candidate) =>
    selectedCandidateIds.has(candidate.id)
  ).length;
  const allVisibleSelected =
    filteredCandidates.length > 0 && selectedVisibleCount === filteredCandidates.length;
  const someVisibleSelected =
    selectedVisibleCount > 0 && selectedVisibleCount < filteredCandidates.length;
  const allSelectedArchived =
    selectedCandidates.length > 0 && selectedCandidates.every((candidate) => candidate.isArchived);

  const toggleCandidateSelection = (candidateId: number, checked: boolean) => {
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(candidateId);
      } else {
        next.delete(candidateId);
      }
      return next;
    });
  };

  const toggleSelectAllVisible = (checked: boolean) => {
    setSelectedCandidateIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        filteredCandidates.forEach((candidate) => next.add(candidate.id));
      } else {
        filteredCandidates.forEach((candidate) => next.delete(candidate.id));
      }
      return next;
    });
  };

  const applyBulkStatus = () => {
    if (!bulkStatus || selectedCandidateIds.size === 0) return;
    bulkUpdateMutation.mutate({
      candidateIds: Array.from(selectedCandidateIds),
      status: bulkStatus,
    });
  };

  const applyBulkAssignee = () => {
    if (selectedCandidateIds.size === 0) return;
    bulkUpdateMutation.mutate({
      candidateIds: Array.from(selectedCandidateIds),
      assignedTo: bulkAssignee === "unassigned" ? null : bulkAssignee,
    });
  };

  const applyBulkArchive = (archive: boolean) => {
    if (selectedCandidateIds.size === 0) return;
    bulkUpdateMutation.mutate({
      candidateIds: Array.from(selectedCandidateIds),
      archive,
    });
  };

  const applySingleArchive = (candidateId: number, archive: boolean) => {
    bulkUpdateMutation.mutate({
      candidateIds: [candidateId],
      archive,
    });
  };

  const filteredInterviews = interviews.filter((interview) => {
    const searchValue = `${interview.candidateName || ""} ${interview.candidatePosition || ""} ${interview.interviewerName || ""}`.toLowerCase();
    const matchesSearch = !interviewSearch || searchValue.includes(interviewSearch.toLowerCase());
    const matchesStatus = interviewStatusFilter === "all" || interview.status === interviewStatusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.position) {
      toast({
        title: "Missing fields",
        description: "Please provide name, email, and position.",
        variant: "destructive",
      });
      return;
    }
    if (editingCandidate) {
      updateCandidateMutation.mutate({ id: editingCandidate.id, data: formData });
      return;
    }
    createCandidateMutation.mutate(formData);
  };

  const handleEdit = (candidate: Candidate) => {
    setEditingCandidate(candidate);
    setFormData({
      firstName: candidate.firstName,
      lastName: candidate.lastName,
      email: candidate.email,
      phone: candidate.phone || "",
      position: candidate.position,
      status: candidate.status,
      source: candidate.source || "",
      resumeUrl: candidate.resumeUrl || "",
      rating: candidate.rating ? candidate.rating.toString() : "",
      notes: candidate.notes || "",
      assignedTo: candidate.assignedTo ? candidate.assignedTo.toString() : "",
    });
    setIsDialogOpen(true);
  };

  const handleViewDetails = (candidate: Candidate) => {
    setSelectedCandidateForDetails(candidate);
  };

  const handleInterviewSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!interviewForm.candidateId || !interviewForm.scheduledAt) {
      toast({
        title: "Missing fields",
        description: "Candidate and scheduled time are required.",
        variant: "destructive",
      });
      return;
    }

    if (editingInterview) {
      updateInterviewMutation.mutate({ id: editingInterview.id, data: interviewForm });
      return;
    }

    createInterviewMutation.mutate(interviewForm);
  };

  const handleInterviewEdit = (interview: Interview) => {
    setEditingInterview(interview);
    setInterviewForm({
      candidateId: interview.candidateId.toString(),
      interviewerId: interview.interviewerId ? interview.interviewerId.toString() : "",
      scheduledAt: interview.scheduledAt
        ? new Date(interview.scheduledAt).toISOString().slice(0, 16)
        : "",
      duration: interview.duration ? interview.duration.toString() : "60",
      type: interview.type || "video",
      status: interview.status || "scheduled",
      location: interview.location || "",
      meetingLink: interview.meetingLink || "",
      notes: interview.notes || "",
    });
    setIsInterviewDialogOpen(true);
  };

  const handleInterviewDialogChange = (open: boolean) => {
    setIsInterviewDialogOpen(open);
    if (!open) {
      resetInterviewForm();
    }
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  if (isLoading) {
    return <div className="p-8">Loading candidates...</div>;
  }

  const statusCounts = statusCandidates.reduce(
    (acc, candidate) => {
      acc[candidate.status] = (acc[candidate.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Recruiting</h1>
        <p className="text-muted-foreground">Manage candidates and job postings</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList className="flex flex-wrap">
            <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="resumes">Resumes</TabsTrigger>
            <TabsTrigger value="criteria">AI Criteria</TabsTrigger>
          </TabsList>
          {activeTab === "pipeline" && (
            <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
              <DialogTrigger asChild>
                <Button onClick={() => resetForm()}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add Candidate
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingCandidate ? "Edit Candidate" : "Add Candidate"}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, firstName: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData((prev) => ({ ...prev, lastName: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="position">Position</Label>
                    <Input
                      id="position"
                      value={formData.position}
                      onChange={(e) => setFormData((prev) => ({ ...prev, position: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="screening">Screening</SelectItem>
                        <SelectItem value="interview">Interview</SelectItem>
                        <SelectItem value="offer">Offer</SelectItem>
                        <SelectItem value="hired">Hired</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="source">Source</Label>
                    <Input
                      id="source"
                      value={formData.source}
                      onChange={(e) => setFormData((prev) => ({ ...prev, source: e.target.value }))}
                    />
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label htmlFor="assignedTo">Assigned To</Label>
                      <Select
                        value={formData.assignedTo || "unassigned"}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            assignedTo: value === "unassigned" ? "" : value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select team member" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              {employee.firstName} {employee.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="rating">Rating</Label>
                      <Select
                        value={formData.rating || "unrated"}
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            rating: value === "unrated" ? "" : value,
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unrated">Unrated</SelectItem>
                          {["1", "2", "3", "4", "5"].map((rating) => (
                            <SelectItem key={rating} value={rating}>
                              {rating} Star{rating === "1" ? "" : "s"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="resumeUrl">Resume URL</Label>
                    <Input
                      id="resumeUrl"
                      value={formData.resumeUrl}
                      onChange={(e) => setFormData((prev) => ({ ...prev, resumeUrl: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={formData.notes}
                      onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                      placeholder="Add interview notes or recruiter context"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" type="button" onClick={() => handleDialogChange(false)}>
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createCandidateMutation.isPending || updateCandidateMutation.isPending}
                    >
                      {createCandidateMutation.isPending || updateCandidateMutation.isPending
                        ? "Saving..."
                        : editingCandidate
                          ? "Update Candidate"
                          : "Add Candidate"}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <TabsContent value="pipeline" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            {["new", "screening", "interview", "offer"].map((status) => (
              <Card key={status}>
                <CardHeader className="pb-2">
                  <CardDescription className="capitalize">{status}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{statusCounts[status] || 0}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <CardTitle>Active Candidates</CardTitle>
                  <CardDescription>Track applicants and hiring progress</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant={pipelineView === "table" ? "default" : "outline"}
                    onClick={() => setPipelineView("table")}
                  >
                    Table
                  </Button>
                  <Button
                    size="sm"
                    variant={pipelineView === "kanban" ? "default" : "outline"}
                    onClick={() => setPipelineView("kanban")}
                  >
                    Kanban
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search candidates..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger disabled={pipelineView === "kanban"}>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="screening">Screening</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="hired">Hired</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Assigned" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All owners</SelectItem>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id.toString()}>
                        {employee.firstName} {employee.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={archiveFilter} onValueChange={(value) => setArchiveFilter(value as typeof archiveFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Archive filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active only</SelectItem>
                    <SelectItem value="archived">Archived only</SelectItem>
                    <SelectItem value="all">All candidates</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedCandidateIds.size > 0 && (
                <div className="flex flex-col gap-3 rounded-lg border bg-muted/30 p-3">
                  <div className="text-sm font-medium">
                    {selectedCandidateIds.size} candidate{selectedCandidateIds.size > 1 ? "s" : ""} selected
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2">
                      <Select value={bulkStatus} onValueChange={setBulkStatus}>
                        <SelectTrigger className="h-8 w-36">
                          <SelectValue placeholder="Set status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="screening">Screening</SelectItem>
                          <SelectItem value="interview">Interview</SelectItem>
                          <SelectItem value="offer">Offer</SelectItem>
                          <SelectItem value="hired">Hired</SelectItem>
                          <SelectItem value="rejected">Rejected</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={!bulkStatus || bulkUpdateMutation.isPending}
                        onClick={applyBulkStatus}
                      >
                        Apply Status
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={bulkAssignee} onValueChange={setBulkAssignee}>
                        <SelectTrigger className="h-8 w-40">
                          <SelectValue placeholder="Assign to" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="unassigned">Unassigned</SelectItem>
                          {employees.map((employee) => (
                            <SelectItem key={employee.id} value={employee.id.toString()}>
                              {employee.firstName} {employee.lastName}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={bulkUpdateMutation.isPending}
                        onClick={applyBulkAssignee}
                      >
                        Assign
                      </Button>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={selectedCandidateIds.size < 2}
                      onClick={() => setIsCompareOpen(true)}
                    >
                      Compare
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={bulkUpdateMutation.isPending}
                      onClick={() => applyBulkArchive(!allSelectedArchived)}
                    >
                      {allSelectedArchived ? "Unarchive" : "Archive"}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setSelectedCandidateIds(new Set())}>
                      Clear
                    </Button>
                  </div>
                </div>
              )}

              {pipelineView === "table" ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left text-sm font-medium">
                          <Checkbox
                            checked={allVisibleSelected ? true : someVisibleSelected ? "indeterminate" : false}
                            onCheckedChange={(checked) => toggleSelectAllVisible(Boolean(checked))}
                          />
                        </th>
                        <th className="text-left py-2 text-sm font-medium">Candidate</th>
                        <th className="text-left py-2 text-sm font-medium">Position</th>
                        <th className="text-left py-2 text-sm font-medium">Status</th>
                        <th className="text-left py-2 text-sm font-medium">Assigned</th>
                        <th className="text-left py-2 text-sm font-medium">Rating</th>
                        <th className="text-left py-2 text-sm font-medium">Source</th>
                        <th className="text-left py-2 text-sm font-medium">Resume</th>
                        <th className="text-left py-2 text-sm font-medium">Applied</th>
                        <th className="text-left py-2 text-sm font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCandidates.map((candidate) => (
                        <tr key={candidate.id} className="border-b">
                          <td className="py-3">
                            <Checkbox
                              checked={selectedCandidateIds.has(candidate.id)}
                              onCheckedChange={(checked) =>
                                toggleCandidateSelection(candidate.id, Boolean(checked))
                              }
                            />
                          </td>
                          <td className="py-3">
                            <div className="font-medium">
                              {candidate.firstName} {candidate.lastName}
                            </div>
                            <div className="text-xs text-muted-foreground">{candidate.email}</div>
                            {candidate.isArchived && (
                              <Badge variant="outline" className="mt-1 text-[10px] uppercase">
                                Archived
                              </Badge>
                            )}
                          </td>
                          <td className="py-3 text-sm">{candidate.position}</td>
                          <td className="py-3 text-sm">
                            <Select
                              value={candidate.status}
                              onValueChange={(value) =>
                                quickUpdateMutation.mutate({ id: candidate.id, data: { status: value } })
                              }
                            >
                              <SelectTrigger className="h-8 w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="new">New</SelectItem>
                                <SelectItem value="screening">Screening</SelectItem>
                                <SelectItem value="interview">Interview</SelectItem>
                                <SelectItem value="offer">Offer</SelectItem>
                                <SelectItem value="hired">Hired</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 text-sm">
                            <Select
                              value={candidate.assignedTo ? candidate.assignedTo.toString() : "unassigned"}
                              onValueChange={(value) =>
                                quickUpdateMutation.mutate({
                                  id: candidate.id,
                                  data: { assignedTo: value === "unassigned" ? "" : value },
                                })
                              }
                            >
                              <SelectTrigger className="h-8 w-36">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unassigned">Unassigned</SelectItem>
                                {employees.map((employee) => (
                                  <SelectItem key={employee.id} value={employee.id.toString()}>
                                    {employee.firstName} {employee.lastName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 text-sm">
                            <Select
                              value={candidate.rating ? candidate.rating.toString() : "unrated"}
                              onValueChange={(value) =>
                                quickUpdateMutation.mutate({
                                  id: candidate.id,
                                  data: { rating: value === "unrated" ? "" : value },
                                })
                              }
                            >
                              <SelectTrigger className="h-8 w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="unrated">Unrated</SelectItem>
                                {["1", "2", "3", "4", "5"].map((rating) => (
                                  <SelectItem key={rating} value={rating}>
                                    {rating}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="py-3 text-sm">{candidate.source || "Direct"}</td>
                          <td className="py-3 text-sm">
                            {candidate.resumeUrl ? (
                              <a
                                href={candidate.resumeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="text-primary underline"
                              >
                                View
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="py-3 text-sm">
                            {new Date(candidate.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleViewDetails(candidate)}>
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(candidate)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => applySingleArchive(candidate.id, !candidate.isArchived)}
                              >
                                {candidate.isArchived ? "Unarchive" : "Archive"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                      {filteredCandidates.length === 0 && (
                        <tr>
                          <td colSpan={10} className="py-6 text-center text-sm text-muted-foreground">
                            No candidates found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                  {statusColumns.map((status) => {
                    const columnCandidates = filteredCandidates.filter(
                      (candidate) => candidate.status === status
                    );
                    return (
                      <div
                        key={status}
                        className="flex h-full flex-col rounded-lg border border-dashed border-muted-foreground/30 bg-muted/20 p-3"
                        onDrop={handleDrop(status)}
                        onDragOver={handleDragOver}
                      >
                        <div className="mb-3 flex items-center justify-between">
                          <span className="text-sm font-semibold capitalize">{status}</span>
                          <Badge variant="secondary">{columnCandidates.length}</Badge>
                        </div>
                        <div className="flex flex-1 flex-col gap-3">
                          {columnCandidates.map((candidate) => {
                            const assigneeName = candidate.assignedTo
                              ? employeeLookup.get(candidate.assignedTo) || "Assigned"
                              : "Unassigned";
                            return (
                              <Card
                                key={candidate.id}
                                className="cursor-grab border shadow-sm active:cursor-grabbing"
                                draggable
                                onDragStart={handleDragStart(candidate.id)}
                              >
                                <CardHeader className="space-y-1 pb-2">
                                  <div className="flex items-start justify-between gap-2">
                                    <div>
                                      <CardTitle className="text-base">
                                        {candidate.firstName} {candidate.lastName}
                                      </CardTitle>
                                      <CardDescription className="text-xs">{candidate.position}</CardDescription>
                                    </div>
                                    <Checkbox
                                      checked={selectedCandidateIds.has(candidate.id)}
                                      onCheckedChange={(checked) =>
                                        toggleCandidateSelection(candidate.id, Boolean(checked))
                                      }
                                    />
                                  </div>
                                  {candidate.isArchived && (
                                    <Badge variant="outline" className="w-fit text-[10px] uppercase">
                                      Archived
                                    </Badge>
                                  )}
                                </CardHeader>
                                <CardContent className="space-y-2 text-xs text-muted-foreground">
                                  <div className="flex items-center justify-between text-sm text-foreground">
                                    <span>{assigneeName}</span>
                                    <span>{candidate.rating ? `${candidate.rating}/5` : "Unrated"}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span>{candidate.source || "Direct"}</span>
                                    <span>{new Date(candidate.createdAt).toLocaleDateString()}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    {candidate.resumeUrl ? (
                                      <a
                                        href={candidate.resumeUrl}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="text-primary underline"
                                      >
                                        Resume
                                      </a>
                                    ) : (
                                      <span>Resume —</span>
                                    )}
                                    <div className="flex items-center gap-1">
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs"
                                        onClick={() => handleViewDetails(candidate)}
                                      >
                                        Details
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs"
                                        onClick={() => handleEdit(candidate)}
                                      >
                                        Edit
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs"
                                        onClick={() => applySingleArchive(candidate.id, !candidate.isArchived)}
                                      >
                                        {candidate.isArchived ? "Unarchive" : "Archive"}
                                      </Button>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                          {columnCandidates.length === 0 && (
                            <div className="rounded-md border border-dashed border-muted-foreground/40 p-4 text-center text-xs text-muted-foreground">
                              Drop candidates here
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <Dialog open={isCompareOpen} onOpenChange={setIsCompareOpen}>
                <DialogContent className="max-w-5xl max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Compare Candidates</DialogTitle>
                  </DialogHeader>
                  {selectedCandidates.length < 2 ? (
                    <p className="text-sm text-muted-foreground">Select at least two candidates to compare.</p>
                  ) : (
                    <div className="space-y-4">
                      {selectedCandidates.length > 4 && (
                        <p className="text-xs text-muted-foreground">
                          Showing the first four candidates. Reduce selection to compare different candidates.
                        </p>
                      )}
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {comparisonCandidates.map((candidate) => (
                          <Card key={`compare-${candidate.id}`} className="border-muted">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-base">
                                {candidate.firstName} {candidate.lastName}
                              </CardTitle>
                              <CardDescription className="text-xs">{candidate.position}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-2 text-sm">
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Status</span>
                                <span className="font-medium capitalize">{candidate.status}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Assignee</span>
                                <span className="font-medium">
                                  {candidate.assignedTo
                                    ? employeeLookup.get(candidate.assignedTo) || "Assigned"
                                    : "Unassigned"}
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Rating</span>
                                <span className="font-medium">{candidate.rating ?? "Unrated"}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Source</span>
                                <span className="font-medium">{candidate.source || "Direct"}</span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-muted-foreground">Applied</span>
                                <span className="font-medium">
                                  {new Date(candidate.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="pt-2 text-xs text-muted-foreground">
                                <div>Email: {candidate.email}</div>
                                {candidate.phone && <div>Phone: {candidate.phone}</div>}
                              </div>
                              {candidate.notes && (
                                <div className="rounded-md border bg-muted/40 p-2 text-xs text-muted-foreground">
                                  {candidate.notes}
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="interviews">
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search interviews..."
                    className="pl-9"
                    value={interviewSearch}
                    onChange={(e) => setInterviewSearch(e.target.value)}
                  />
                </div>
                <Select value={interviewStatusFilter} onValueChange={setInterviewStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All statuses</SelectItem>
                    <SelectItem value="scheduled">Scheduled</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                    <SelectItem value="no_show">No Show</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Dialog open={isInterviewDialogOpen} onOpenChange={handleInterviewDialogChange}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetInterviewForm()}>
                    <CalendarClock className="mr-2 h-4 w-4" />
                    Schedule Interview
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[85vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingInterview ? "Edit Interview" : "Schedule Interview"}</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleInterviewSubmit} className="space-y-4">
                    <div>
                      <Label>Candidate</Label>
                      <Select
                        value={interviewForm.candidateId}
                        onValueChange={(value) => setInterviewForm((prev) => ({ ...prev, candidateId: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select candidate" />
                        </SelectTrigger>
                        <SelectContent>
                          {candidates.map((candidate) => (
                            <SelectItem key={candidate.id} value={candidate.id.toString()}>
                              {candidate.firstName} {candidate.lastName} • {candidate.position}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label>Interviewer</Label>
                        <Select
                          value={interviewForm.interviewerId || "unassigned"}
                          onValueChange={(value) =>
                            setInterviewForm((prev) => ({
                              ...prev,
                              interviewerId: value === "unassigned" ? "" : value,
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select interviewer" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="unassigned">Unassigned</SelectItem>
                            {employees.map((employee) => (
                              <SelectItem key={employee.id} value={employee.id.toString()}>
                                {employee.firstName} {employee.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Type</Label>
                        <Select
                          value={interviewForm.type}
                          onValueChange={(value) => setInterviewForm((prev) => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="phone">Phone</SelectItem>
                            <SelectItem value="video">Video</SelectItem>
                            <SelectItem value="in_person">In Person</SelectItem>
                            <SelectItem value="panel">Panel</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="interview-time">Scheduled At</Label>
                        <Input
                          id="interview-time"
                          type="datetime-local"
                          value={interviewForm.scheduledAt}
                          onChange={(e) =>
                            setInterviewForm((prev) => ({ ...prev, scheduledAt: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="interview-duration">Duration (minutes)</Label>
                        <Input
                          id="interview-duration"
                          type="number"
                          min={15}
                          value={interviewForm.duration}
                          onChange={(e) =>
                            setInterviewForm((prev) => ({ ...prev, duration: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <Label htmlFor="interview-location">Location</Label>
                        <Input
                          id="interview-location"
                          value={interviewForm.location}
                          onChange={(e) =>
                            setInterviewForm((prev) => ({ ...prev, location: e.target.value }))
                          }
                        />
                      </div>
                      <div>
                        <Label htmlFor="interview-link">Meeting Link</Label>
                        <Input
                          id="interview-link"
                          value={interviewForm.meetingLink}
                          onChange={(e) =>
                            setInterviewForm((prev) => ({ ...prev, meetingLink: e.target.value }))
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="interview-notes">Notes</Label>
                      <Textarea
                        id="interview-notes"
                        value={interviewForm.notes}
                        onChange={(e) =>
                          setInterviewForm((prev) => ({ ...prev, notes: e.target.value }))
                        }
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" type="button" onClick={() => handleInterviewDialogChange(false)}>
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={createInterviewMutation.isPending || updateInterviewMutation.isPending}
                      >
                        {createInterviewMutation.isPending || updateInterviewMutation.isPending
                          ? "Saving..."
                          : editingInterview
                            ? "Update Interview"
                            : "Schedule Interview"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Interview Schedule</CardTitle>
                <CardDescription>{filteredInterviews.length} interviews</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredInterviews.map((interview) => (
                  <div
                    key={interview.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <div className="font-medium">
                        {interview.candidateName || "Candidate"}{" "}
                        {interview.candidatePosition ? `• ${interview.candidatePosition}` : ""}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(interview.scheduledAt).toLocaleString()} •{" "}
                        {interview.duration || 60} min • {interview.type}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Interviewer: {interview.interviewerName || "Unassigned"}
                      </div>
                      {interview.meetingLink && (
                        <a
                          href={interview.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sm text-primary underline"
                        >
                          Join meeting
                        </a>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Select
                        value={interview.status}
                        onValueChange={(value) =>
                          quickInterviewStatusMutation.mutate({
                            id: interview.id,
                            status: value as Interview["status"],
                          })
                        }
                      >
                        <SelectTrigger className="h-8 w-36">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                          <SelectItem value="no_show">No Show</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" onClick={() => handleInterviewEdit(interview)}>
                        Edit
                      </Button>
                    </div>
                  </div>
                ))}
                {filteredInterviews.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No interviews scheduled.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <RecruitingAnalyticsPage embedded />
        </TabsContent>
        <TabsContent value="resumes">
          <ResumeUploaderPage embedded />
        </TabsContent>
        <TabsContent value="criteria">
          <AICriteriaConfigPage embedded />
        </TabsContent>
      </Tabs>

      <CandidateDetailsDialog
        candidate={selectedCandidateForDetails}
        open={!!selectedCandidateForDetails}
        onOpenChange={(open) => !open && setSelectedCandidateForDetails(null)}
        employeeLookup={employeeLookup}
      />
    </div>
  );
}

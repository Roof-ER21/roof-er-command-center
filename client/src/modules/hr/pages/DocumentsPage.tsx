import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/useToast";
import { usePermissions } from "@/hooks/usePermissions";
import { Download, FileText, Search, Upload, CheckCircle } from "lucide-react";
import { useLocation, useSearchParams } from "react-router-dom";
import { CoiDocumentsPage } from "@/modules/hr/pages/CoiDocumentsPage";
import { EmailTemplatesPage } from "@/modules/hr/pages/EmailTemplatesPage";
import { useAuth } from "@/hooks/useAuth";

interface HRDocument {
  id: number;
  name: string;
  description?: string;
  category: string;
  type: string;
  fileUrl: string;
  fileSize: number;
  status: string;
  visibility: string;
  tags?: string[];
  downloadCount: number;
  createdAt: string;
  acknowledged?: boolean;
}

interface DocumentAcknowledgement {
  id: number;
  documentId: number;
  userId: number;
  acknowledgedAt: string;
  documentName?: string;
  documentVisibility?: string;
  documentStatus?: string;
  userName?: string;
}

interface DocumentAcknowledgementsResponse {
  acknowledgements: DocumentAcknowledgement[];
  summary?: Array<{
    documentId: number;
    name: string;
    visibility: string;
    status: string;
    acknowledgedCount: number;
  }>;
  totalEmployees?: number;
}

interface DocumentAssignmentRow {
  id: number;
  documentId: number;
  userId: number;
  dueDate?: string | null;
  status: "assigned" | "acknowledged" | "overdue";
  acknowledgedAt?: string | null;
  assignedAt: string;
  documentName?: string;
  documentVisibility?: string;
  documentStatus?: string;
  documentFileUrl?: string | null;
  userName?: string;
}

interface DocumentAssignmentsResponse {
  assignments: DocumentAssignmentRow[];
}

const categoryOptions = [
  "POLICY",
  "FORM",
  "HANDBOOK",
  "PROCEDURE",
  "TEMPLATE",
  "LEGAL",
  "TRAINING",
  "OTHER",
];

const statusColors: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
  REVIEW: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
  APPROVED: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  ARCHIVED: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const assignmentStatusColors: Record<string, string> = {
  assigned: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200",
  acknowledged: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

export function DocumentsPage() {
  const { toast } = useToast();
  const { isAdmin, isManager } = usePermissions();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState({
    category: "ALL",
    status: "ALL",
    visibility: "ALL",
    search: "",
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<HRDocument | null>(null);
  const [isAssignmentOpen, setIsAssignmentOpen] = useState(false);
  const [assignmentForm, setAssignmentForm] = useState({
    documentId: "",
    dueDate: "",
    assignAll: true,
    userIds: [] as number[],
  });
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    category: "POLICY",
    type: "PDF",
    visibility: "EMPLOYEE",
    fileUrl: "",
    tags: "",
  });
  const [editData, setEditData] = useState({
    name: "",
    description: "",
    category: "POLICY",
    type: "PDF",
    visibility: "EMPLOYEE",
    status: "DRAFT",
    fileUrl: "",
    tags: "",
  });
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: documents = [], isLoading } = useQuery<HRDocument[]>({
    queryKey: ["/api/hr/documents", filters],
    queryFn: async () => {
      const params = new URLSearchParams({
        category: filters.category,
        status: filters.status,
        visibility: filters.visibility,
        search: filters.search,
      });
      const response = await fetch(`/api/hr/documents?${params.toString()}`, {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch documents");
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

  const { data: acknowledgementsData } = useQuery<DocumentAcknowledgementsResponse>({
    queryKey: ["/api/hr/documents/acknowledgements"],
    queryFn: async () => {
      const response = await fetch("/api/hr/documents/acknowledgements", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch acknowledgements");
      return response.json();
    },
  });

  const { data: assignmentsData } = useQuery<DocumentAssignmentsResponse>({
    queryKey: ["/api/hr/documents/assignments"],
    queryFn: async () => {
      const response = await fetch("/api/hr/documents/assignments", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch assignments");
      return response.json();
    },
  });

  const acknowledgementSummary = acknowledgementsData?.summary || [];
  const acknowledgementRows = acknowledgementsData?.acknowledgements || [];
  const totalEmployees = acknowledgementsData?.totalEmployees || 0;
  const assignmentRows = assignmentsData?.assignments || [];
  const myAssignments = user
    ? assignmentRows.filter((assignment) => assignment.userId === user.id)
    : assignmentRows;
  const visibleAssignments = isManager() ? assignmentRows : myAssignments;

  const tabFromQuery = searchParams.get("tab");
  const tabFromPath = location.pathname.includes("coi-documents")
    ? "coi"
    : location.pathname.includes("email-templates")
      ? "templates"
      : "library";
  const resolvedTab = tabFromQuery || tabFromPath;
  const [activeTab, setActiveTab] = useState(resolvedTab);

  useEffect(() => {
    setActiveTab(resolvedTab);
  }, [resolvedTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const onBasePath = location.pathname === "/hr/documents";
    if (value === "library" && onBasePath) {
      setSearchParams({}, { replace: true });
      return;
    }
    setSearchParams({ tab: value }, { replace: true });
  };

  const createDocumentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/hr/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...formData,
          tags: formData.tags
            ? formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
            : [],
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create document");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/documents"] });
      setIsDialogOpen(false);
      setFormData({
        name: "",
        description: "",
        category: "POLICY",
        type: "PDF",
        visibility: "EMPLOYEE",
        fileUrl: "",
        tags: "",
      });
      toast({
        title: "Document added",
        description: "Document has been saved to the library.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to create document",
        variant: "destructive",
      });
    },
  });

  const updateDocumentMutation = useMutation({
    mutationFn: async () => {
      if (!editingDocument) throw new Error("No document selected");
      const response = await fetch(`/api/hr/documents/${editingDocument.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: editData.name,
          description: editData.description,
          category: editData.category,
          type: editData.type,
          visibility: editData.visibility,
          status: editData.status,
          fileUrl: editData.fileUrl,
          tags: editData.tags
            ? editData.tags.split(",").map((tag) => tag.trim()).filter(Boolean)
            : [],
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to update document");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/documents"] });
      setIsEditOpen(false);
      setEditingDocument(null);
      toast({
        title: "Document updated",
        description: "Document details have been saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update document",
        variant: "destructive",
      });
    },
  });

  const createAssignmentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/hr/documents/assignments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          documentId: assignmentForm.documentId,
          dueDate: assignmentForm.dueDate || undefined,
          assignAll: assignmentForm.assignAll,
          userIds: assignmentForm.userIds,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to assign document");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/documents/assignments"] });
      setIsAssignmentOpen(false);
      setAssignmentForm({ documentId: "", dueDate: "", assignAll: true, userIds: [] });
      toast({
        title: "Assignments created",
        description: "Required read assignments sent.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to assign document",
        variant: "destructive",
      });
    },
  });

  const downloadMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await fetch(`/api/hr/documents/${documentId}/download`, {
        credentials: "include",
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to download document");
      }
      return response.json();
    },
    onSuccess: (data) => {
      if (data?.fileUrl) {
        window.open(data.fileUrl, "_blank");
      }
      queryClient.invalidateQueries({ queryKey: ["/api/hr/documents"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to download document",
        variant: "destructive",
      });
    },
  });

  const acknowledgeMutation = useMutation({
    mutationFn: async (documentId: number) => {
      const response = await fetch(`/api/hr/documents/${documentId}/acknowledge`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ signature: "Acknowledged", notes: "" }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to acknowledge document");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/documents"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/documents/assignments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/documents/acknowledgements"] });
      toast({
        title: "Acknowledged",
        description: "Document acknowledgement recorded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to acknowledge document",
        variant: "destructive",
      });
    },
  });

  const openEdit = (doc: HRDocument) => {
    setEditingDocument(doc);
    setEditData({
      name: doc.name,
      description: doc.description || "",
      category: doc.category,
      type: doc.type,
      visibility: doc.visibility,
      status: doc.status,
      fileUrl: doc.fileUrl,
      tags: doc.tags ? doc.tags.join(", ") : "",
    });
    setIsEditOpen(true);
  };

  if (isLoading) {
    return <div className="p-8">Loading documents...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Documents</h1>
          <p className="text-muted-foreground">Policies, forms, and employee resources</p>
        </div>
        {activeTab === "library" && (isAdmin() || isManager()) && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                Add Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>New Document</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="doc-name">Name</Label>
                  <Input
                    id="doc-name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="doc-desc">Description</Label>
                  <Input
                    id="doc-desc"
                    value={formData.description}
                    onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Category</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {categoryOptions.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Visibility</Label>
                    <Select
                      value={formData.visibility}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, visibility: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="EMPLOYEE">Employee</SelectItem>
                        <SelectItem value="MANAGER">Manager</SelectItem>
                        <SelectItem value="ADMIN">Admin</SelectItem>
                        <SelectItem value="PUBLIC">Public</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="doc-url">File URL</Label>
                  <Input
                    id="doc-url"
                    placeholder="https://..."
                    value={formData.fileUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fileUrl: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="doc-tags">Tags (comma separated)</Label>
                  <Input
                    id="doc-tags"
                    value={formData.tags}
                    onChange={(e) => setFormData((prev) => ({ ...prev, tags: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    onClick={() => createDocumentMutation.mutate()}
                    disabled={createDocumentMutation.isPending}
                  >
                    {createDocumentMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="library">Library</TabsTrigger>
          <TabsTrigger value="coi">COI</TabsTrigger>
          <TabsTrigger value="templates">Email Templates</TabsTrigger>
          <TabsTrigger value="acknowledgements">Acknowledgements</TabsTrigger>
        </TabsList>

        <TabsContent value="library" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
              <CardDescription>Find the documents you need</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 md:grid-cols-4">
                <Select
                  value={filters.category}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Categories</SelectItem>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filters.status}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Statuses</SelectItem>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="REVIEW">Review</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.visibility}
                  onValueChange={(value) => setFilters((prev) => ({ ...prev, visibility: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Visibility" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">All Visibility</SelectItem>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                  </SelectContent>
                </Select>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    className="pl-9"
                    value={filters.search}
                    onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Document Library</CardTitle>
              <CardDescription>{documents.length} documents available</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-md bg-muted p-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{doc.name}</div>
                        <div className="text-sm text-muted-foreground">{doc.description || "No description"}</div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          <span>{doc.category}</span>
                          <span>•</span>
                          <span>{doc.type}</span>
                          <span>•</span>
                          <span>{doc.visibility}</span>
                          <span>•</span>
                          <span>{doc.downloadCount} downloads</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={statusColors[doc.status] || statusColors.DRAFT}>
                        {doc.status}
                      </Badge>
                      {doc.acknowledged && (
                        <Badge variant="secondary">Acknowledged</Badge>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => downloadMutation.mutate(doc.id)}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={doc.acknowledged}
                        onClick={() => acknowledgeMutation.mutate(doc.id)}
                      >
                        <CheckCircle className="mr-2 h-4 w-4" />
                        {doc.acknowledged ? "Acknowledged" : "Acknowledge"}
                      </Button>
                      {(isAdmin() || isManager()) && (
                        <Button variant="ghost" size="sm" onClick={() => openEdit(doc)}>
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
                {documents.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No documents match these filters.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="coi">
          <CoiDocumentsPage embedded />
        </TabsContent>
        <TabsContent value="templates">
          <EmailTemplatesPage embedded />
        </TabsContent>

        <TabsContent value="acknowledgements">
          <div className="space-y-6">
            <Card>
              <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <CardTitle>Required Reads</CardTitle>
                  <CardDescription>Documents assigned for acknowledgement</CardDescription>
                </div>
                {isManager() && (
                  <Dialog open={isAssignmentOpen} onOpenChange={setIsAssignmentOpen}>
                    <DialogTrigger asChild>
                      <Button>Assign Required Read</Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                      <DialogHeader>
                        <DialogTitle>Assign Required Read</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label>Document</Label>
                          <Select
                            value={assignmentForm.documentId}
                            onValueChange={(value) =>
                              setAssignmentForm((prev) => ({ ...prev, documentId: value }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select document" />
                            </SelectTrigger>
                            <SelectContent>
                              {documents.map((doc) => (
                                <SelectItem key={doc.id} value={doc.id.toString()}>
                                  {doc.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <Label htmlFor="assignment-due">Due Date</Label>
                            <Input
                              id="assignment-due"
                              type="date"
                              value={assignmentForm.dueDate}
                              onChange={(e) =>
                                setAssignmentForm((prev) => ({ ...prev, dueDate: e.target.value }))
                              }
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <Checkbox
                              id="assign-all"
                              checked={assignmentForm.assignAll}
                              onCheckedChange={(checked) =>
                                setAssignmentForm((prev) => ({
                                  ...prev,
                                  assignAll: Boolean(checked),
                                }))
                              }
                            />
                            <Label htmlFor="assign-all">Assign to all active employees</Label>
                          </div>
                        </div>
                        {!assignmentForm.assignAll && (
                          <div>
                            <Label>Select Employees</Label>
                            <ScrollArea className="h-48 rounded border p-3">
                              <div className="space-y-2">
                                {employees.map((employee) => (
                                  <label key={employee.id} className="flex items-center gap-2 text-sm">
                                    <Checkbox
                                      checked={assignmentForm.userIds.includes(employee.id)}
                                      onCheckedChange={(checked) => {
                                        setAssignmentForm((prev) => {
                                          const next = new Set(prev.userIds);
                                          if (checked) {
                                            next.add(employee.id);
                                          } else {
                                            next.delete(employee.id);
                                          }
                                          return { ...prev, userIds: Array.from(next) };
                                        });
                                      }}
                                    />
                                    <span>{employee.firstName} {employee.lastName}</span>
                                  </label>
                                ))}
                              </div>
                            </ScrollArea>
                          </div>
                        )}
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setIsAssignmentOpen(false);
                              setAssignmentForm({ documentId: "", dueDate: "", assignAll: true, userIds: [] });
                            }}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={() => createAssignmentMutation.mutate()}
                            disabled={!assignmentForm.documentId || createAssignmentMutation.isPending}
                          >
                            {createAssignmentMutation.isPending ? "Assigning..." : "Assign"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                )}
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                {visibleAssignments.map((assignment) => (
                  <div key={assignment.id} className="flex flex-col gap-2 rounded border p-4">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{assignment.documentName}</span>
                      <Badge className={assignmentStatusColors[assignment.status] || ""}>
                        {assignment.status}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground">
                      Due {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No due date"}
                    </div>
                    {isManager() && (
                      <div className="text-muted-foreground">
                        Assigned to {assignment.userName || "Employee"}
                      </div>
                    )}
                    {assignment.documentFileUrl && (
                      <a
                        href={assignment.documentFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline text-sm"
                      >
                        Open document
                      </a>
                    )}
                    {assignment.userId === user?.id && assignment.status !== "acknowledged" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={acknowledgeMutation.isPending}
                        onClick={() => acknowledgeMutation.mutate(assignment.documentId)}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </div>
                ))}
                {visibleAssignments.length === 0 && (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    No required reads assigned.
                  </div>
                )}
              </CardContent>
            </Card>

            {acknowledgementSummary.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Acknowledgement Progress</CardTitle>
                  <CardDescription>Document acknowledgement status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {acknowledgementSummary.map((doc) => {
                    const total = totalEmployees || 0;
                    const percent = total ? Math.round((doc.acknowledgedCount / total) * 100) : 0;
                    return (
                      <div key={doc.documentId} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{doc.name}</span>
                          <span className="text-muted-foreground">
                            {doc.acknowledgedCount}/{total || "—"} ({percent}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted">
                          <div
                            className="h-2 rounded-full bg-primary"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Acknowledgement Log</CardTitle>
                <CardDescription>{acknowledgementRows.length} acknowledgements recorded</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {acknowledgementRows.map((ack) => (
                  <div key={ack.id} className="flex flex-col gap-2 rounded border p-4 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{ack.documentName || "Document"}</span>
                      <Badge variant="outline">{ack.documentStatus || "DRAFT"}</Badge>
                    </div>
                    <div className="text-muted-foreground">
                      {ack.userName || "Employee"} • {ack.documentVisibility || "EMPLOYEE"}
                    </div>
                    <div className="text-muted-foreground">
                      Acknowledged {new Date(ack.acknowledgedAt).toLocaleString()}
                    </div>
                  </div>
                ))}
                {acknowledgementRows.length === 0 && (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    No acknowledgements recorded.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog
        open={isEditOpen}
        onOpenChange={(open) => {
          setIsEditOpen(open);
          if (!open) {
            setEditingDocument(null);
          }
        }}
      >
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-doc-name">Name</Label>
              <Input
                id="edit-doc-name"
                value={editData.name}
                onChange={(e) => setEditData((prev) => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-doc-desc">Description</Label>
              <Input
                id="edit-doc-desc"
                value={editData.description}
                onChange={(e) => setEditData((prev) => ({ ...prev, description: e.target.value }))}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Category</Label>
                <Select
                  value={editData.category}
                  onValueChange={(value) => setEditData((prev) => ({ ...prev, category: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select
                  value={editData.status}
                  onValueChange={(value) => setEditData((prev) => ({ ...prev, status: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DRAFT">Draft</SelectItem>
                    <SelectItem value="REVIEW">Review</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="ARCHIVED">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label>Type</Label>
                <Select
                  value={editData.type}
                  onValueChange={(value) => setEditData((prev) => ({ ...prev, type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PDF">PDF</SelectItem>
                    <SelectItem value="DOC">DOC</SelectItem>
                    <SelectItem value="DOCX">DOCX</SelectItem>
                    <SelectItem value="XLS">XLS</SelectItem>
                    <SelectItem value="XLSX">XLSX</SelectItem>
                    <SelectItem value="TXT">TXT</SelectItem>
                    <SelectItem value="IMAGE">Image</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Visibility</Label>
                <Select
                  value={editData.visibility}
                  onValueChange={(value) => setEditData((prev) => ({ ...prev, visibility: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="EMPLOYEE">Employee</SelectItem>
                    <SelectItem value="MANAGER">Manager</SelectItem>
                    <SelectItem value="ADMIN">Admin</SelectItem>
                    <SelectItem value="PUBLIC">Public</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-doc-url">File URL</Label>
              <Input
                id="edit-doc-url"
                value={editData.fileUrl}
                onChange={(e) => setEditData((prev) => ({ ...prev, fileUrl: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="edit-doc-tags">Tags (comma separated)</Label>
              <Input
                id="edit-doc-tags"
                value={editData.tags}
                onChange={(e) => setEditData((prev) => ({ ...prev, tags: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditOpen(false);
                  setEditingDocument(null);
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={() => updateDocumentMutation.mutate()}
                disabled={updateDocumentMutation.isPending}
              >
                {updateDocumentMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

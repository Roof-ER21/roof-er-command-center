import { useMemo, useState, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useDropzone } from "react-dropzone";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { 
  FileText, 
  Upload, 
  FolderSync, 
  CheckCircle2, 
  Loader2, 
  Clock, 
  User, 
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { format } from "date-fns";
import { SourcerAssignmentDialog } from "../components/SourcerAssignmentDialog";
import { apiRequest } from "@/lib/queryClient";
import type { Candidate } from "@shared/schema";

const CATEGORIES = [
  { id: "insurance-sales", name: "Insurance Sales", color: "bg-red-500", icon: FileText, description: "Insurance sales representatives" },
  { id: "retail-closer", name: "Retail Closer", color: "bg-green-500", icon: FileText, description: "Retail closing sales positions" },
  { id: "retail-marketing", name: "Retail Marketing", color: "bg-purple-500", icon: FileText, description: "Retail marketing and lead generation" },
  { id: "office", name: "Office", color: "bg-orange-500", icon: FileText, description: "Administrative and office roles" },
  { id: "production", name: "Production", color: "bg-blue-500", icon: FileText, description: "Production coordination and scheduling" },
  { id: "field-tech", name: "Field Tech", color: "bg-cyan-500", icon: FileText, description: "Field technicians and installers" },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'];

export function ResumeUploaderPage({ embedded = false }: { embedded?: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState<CategoryId>("insurance-sales");
  const [syncDialogOpen, setSyncDialogOpen] = useState(false);
  const [sourceFolderId, setSourceFolderId] = useState("");
  
  // Sourcer assignment state
  const [showAssignmentDialog, setShowAssignmentDialog] = useState(false);
  const [pendingCandidate, setPendingCandidate] = useState<Candidate | null>(null);

  // Fetch candidates
  const { data: candidates = [], isLoading } = useQuery<Candidate[]>({
    queryKey: ["/api/hr/candidates"],
    queryFn: async () => {
      const response = await fetch("/api/hr/candidates", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch candidates");
      return response.json();
    },
  });

  const activeCategoryData = CATEGORIES.find(c => c.id === activeCategory)!;

  // Filter candidates by category (source)
  const filteredCandidates = useMemo(() => {
    return candidates
      .filter((candidate) => (candidate.source || "insurance-sales") === activeCategory)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [candidates, activeCategory]);

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      // In a real app, this would upload the file and parse it.
      // For now, we'll simulate parsing and create a candidate.
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Mock parsed data
      const mockCandidate = {
        firstName: "Parsed",
        lastName: "Candidate",
        email: `candidate-${Date.now()}@example.com`,
        position: activeCategoryData.name,
        source: activeCategory,
        resumeUrl: URL.createObjectURL(file),
        status: "new",
      };

      const response = await fetch("/api/hr/candidates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(mockCandidate),
      });

      if (!response.ok) {
        throw new Error("Failed to upload resume");
      }
      return response.json();
    },
    onSuccess: (newCandidate) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/candidates"] });
      setPendingCandidate(newCandidate);
      setShowAssignmentDialog(true);
      toast({
        title: "Resume uploaded",
        description: "Candidate created from resume.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error?.message || "Failed to upload resume",
        variant: "destructive",
      });
    },
  });

  // Sync from Drive mutation
  const syncMutation = useMutation({
    mutationFn: async () => {
      // Simulate sync
      await new Promise(resolve => setTimeout(resolve, 2000));
      return { processed: 3 };
    },
    onSuccess: (data) => {
      setSyncDialogOpen(false);
      toast({
        title: "Sync complete",
        description: `Processed ${data.processed} new resumes from Drive.`,
      });
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      uploadMutation.mutate(acceptedFiles[0]);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
    disabled: uploadMutation.isPending
  });

  if (isLoading) {
    return <div className="p-8">Loading resumes...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        {!embedded && (
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Resume Uploader</h1>
            <p className="text-muted-foreground">Upload resumes to automatically create candidates</p>
          </div>
        )}
        <Dialog open={syncDialogOpen} onOpenChange={setSyncDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="gap-2">
              <FolderSync className="h-4 w-4" />
              Sync from Drive
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Sync Resumes from Google Drive</DialogTitle>
              <DialogDescription>
                Import resumes from a Google Drive folder. The folder should have subfolders
                named like the categories.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="folderId">Source Folder ID (optional)</Label>
                <Input
                  id="folderId"
                  placeholder="Leave empty to use default folder"
                  value={sourceFolderId}
                  onChange={(e) => setSourceFolderId(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  The folder ID can be found in the Google Drive URL after /folders/
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSyncDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
              >
                {syncMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Start Sync
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeCategory} onValueChange={(v) => setActiveCategory(v as CategoryId)}>
        <TabsList className="grid w-full grid-cols-3 md:grid-cols-6 h-auto">
          {CATEGORIES.map((cat) => (
            <TabsTrigger 
              key={cat.id} 
              value={cat.id} 
              className={`flex flex-col items-center gap-2 py-3 data-[state=active]:bg-muted`}
            >
              <span className={`h-2 w-2 rounded-full ${cat.color}`} />
              <span className="hidden sm:inline text-xs">{cat.name}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {/* Upload Zone */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload Resume
              </CardTitle>
              <CardDescription>
                {activeCategoryData.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div
                {...getRootProps()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
                  ${isDragActive ? 'border-primary bg-primary/5 scale-[1.02]' : 'border-muted-foreground/25 hover:border-primary/50'}
                  ${uploadMutation.isPending ? 'opacity-50 pointer-events-none' : ''}
                `}
              >
                <input {...getInputProps()} />
                {uploadMutation.isPending ? (
                  <>
                    <Loader2 className="h-12 w-12 mx-auto text-primary mb-4 animate-spin" />
                    <p className="font-medium">Processing resume...</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      AI is extracting candidate information
                    </p>
                  </>
                ) : isDragActive ? (
                  <>
                    <Upload className="h-12 w-12 mx-auto text-primary mb-4" />
                    <p className="font-medium">Drop the resume here...</p>
                  </>
                ) : (
                  <>
                    <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="font-medium">Drag & drop a resume here</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      or click to select (PDF, DOC, DOCX)
                    </p>
                    <p className="text-xs text-muted-foreground mt-4">
                      AI will automatically extract the candidate's name and create their profile
                    </p>
                  </>
                )}
              </div>

              <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  AI-powered name extraction
                </div>
                <div>Max file size: 10MB</div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Uploads */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Uploads
                </span>
                <Badge variant="secondary">
                  {filteredCandidates.length} total
                </Badge>
              </CardTitle>
              <CardDescription>
                Recently uploaded resumes for {activeCategoryData.name}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {filteredCandidates.length > 0 ? (
                  filteredCandidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full ${activeCategoryData.color} bg-opacity-20 flex items-center justify-center`}>
                          <User className="h-5 w-5 opacity-80" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">
                            {candidate.firstName} {candidate.lastName}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{candidate.status}</span>
                            <span>•</span>
                            <span>{format(new Date(candidate.createdAt), 'MMM d')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {candidate.resumeUrl && (
                          <Button
                            variant="ghost"
                            size="icon"
                            asChild
                          >
                            <a
                              href={candidate.resumeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="View Resume"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No resumes uploaded yet.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </Tabs>

      <SourcerAssignmentDialog 
        candidate={pendingCandidate}
        open={showAssignmentDialog}
        onOpenChange={setShowAssignmentDialog}
      />
    </div>
  );
}
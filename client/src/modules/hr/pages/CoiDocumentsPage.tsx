import { useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { usePermissions } from "@/hooks/usePermissions";
import { ShieldCheck, Plus } from "lucide-react";

interface CoiDocument {
  id: number;
  vendorName: string;
  policyNumber?: string;
  carrier?: string;
  expirationDate?: string;
  fileUrl?: string;
  status: "active" | "expired" | "pending";
}

export function CoiDocumentsPage({ embedded = false }: { embedded?: boolean }) {
  const { toast } = useToast();
  const { isManager } = usePermissions();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    vendorName: "",
    policyNumber: "",
    carrier: "",
    expirationDate: "",
    fileUrl: "",
    status: "pending",
  });

  const { data: documents = [], isLoading } = useQuery<CoiDocument[]>({
    queryKey: ["/api/hr/coi-documents"],
    queryFn: async () => {
      const response = await fetch("/api/hr/coi-documents", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch COI documents");
      return response.json();
    },
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/hr/coi-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create COI document");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/coi-documents"] });
      setIsDialogOpen(false);
      setFormData({
        vendorName: "",
        policyNumber: "",
        carrier: "",
        expirationDate: "",
        fileUrl: "",
        status: "pending",
      });
      toast({
        title: "COI added",
        description: "Certificate of insurance saved.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to add COI document",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.vendorName) {
      toast({
        title: "Missing vendor",
        description: "Vendor name is required.",
        variant: "destructive",
      });
      return;
    }
    createMutation.mutate();
  };

  if (isLoading) {
    return <div className="p-8">Loading COI documents...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        {!embedded && (
          <div>
            <h1 className="text-3xl font-bold tracking-tight">COI Documents</h1>
            <p className="text-muted-foreground">Track certificates of insurance for vendors</p>
          </div>
        )}
        {isManager() && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add COI
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add COI Document</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="coi-vendor">Vendor Name</Label>
                  <Input
                    id="coi-vendor"
                    value={formData.vendorName}
                    onChange={(e) => setFormData((prev) => ({ ...prev, vendorName: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="coi-policy">Policy Number</Label>
                  <Input
                    id="coi-policy"
                    value={formData.policyNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, policyNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="coi-carrier">Carrier</Label>
                  <Input
                    id="coi-carrier"
                    value={formData.carrier}
                    onChange={(e) => setFormData((prev) => ({ ...prev, carrier: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="coi-expiration">Expiration Date</Label>
                  <Input
                    id="coi-expiration"
                    type="date"
                    value={formData.expirationDate}
                    onChange={(e) => setFormData((prev) => ({ ...prev, expirationDate: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="coi-file">File URL</Label>
                  <Input
                    id="coi-file"
                    value={formData.fileUrl}
                    onChange={(e) => setFormData((prev) => ({ ...prev, fileUrl: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending}>
                    {createMutation.isPending ? "Saving..." : "Save"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Certificates</CardTitle>
          <CardDescription>{documents.length} documents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {documents.map((doc) => (
            <div key={doc.id} className="rounded border p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="font-medium">{doc.vendorName}</span>
                </div>
                <Badge variant="outline">{doc.status}</Badge>
              </div>
              <div className="mt-2 text-sm text-muted-foreground">
                {doc.carrier || "Carrier N/A"} • {doc.policyNumber || "Policy N/A"}
              </div>
              {doc.expirationDate && (
                <div className="text-sm text-muted-foreground">
                  Expires {doc.expirationDate}
                </div>
              )}
            </div>
          ))}
          {documents.length === 0 && (
            <div className="py-8 text-center text-sm text-muted-foreground">
              No COI documents uploaded.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

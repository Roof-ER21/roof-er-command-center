import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { Link2, Wrench } from "lucide-react";

interface EquipmentItem {
  id: number;
  name: string;
  type: string;
  serialNumber?: string;
  status: "available" | "assigned" | "maintenance" | "retired";
}

type SignatureType = "agreement" | "checklist" | "return" | "receipt";

const signatureRoutes: Record<SignatureType, string> = {
  agreement: "/public/equipment-agreement",
  checklist: "/public/equipment-checklist",
  return: "/public/equipment-return",
  receipt: "/public/equipment-receipt",
};

export function ToolsPage() {
  const { toast } = useToast();
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string>("");
  const [signatureType, setSignatureType] = useState<SignatureType>("agreement");
  const [generatedLink, setGeneratedLink] = useState("");
  const [recentLinks, setRecentLinks] = useState<
    Array<{ id: number; type: SignatureType; url: string; createdAt: string }>
  >([]);

  const { data: equipment = [], isLoading } = useQuery<EquipmentItem[]>({
    queryKey: ["/api/hr/equipment"],
    queryFn: async () => {
      const response = await fetch("/api/hr/equipment", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch equipment");
      return response.json();
    },
  });

  const createSignatureLink = useMutation({
    mutationFn: async () => {
      if (!selectedEquipmentId) {
        throw new Error("Select equipment before generating a link");
      }
      const response = await fetch(`/api/hr/equipment/${selectedEquipmentId}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: signatureType }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to generate link");
      }
      return response.json();
    },
    onSuccess: (data) => {
      const url = `${window.location.origin}${signatureRoutes[signatureType]}/${data.token}`;
      setGeneratedLink(url);
      setRecentLinks((prev) => [
        { id: data.id, type: signatureType, url, createdAt: new Date().toISOString() },
        ...prev.slice(0, 4),
      ]);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).catch(() => undefined);
      }
      toast({
        title: "Link generated",
        description: "Signature link copied to clipboard.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to generate link",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="p-8">Loading tools...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Tools & Forms</h1>
        <p className="text-muted-foreground">Generate equipment signature links and forms</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Equipment Signature Links</CardTitle>
            <CardDescription>Share forms for equipment agreements and returns</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label htmlFor="tool-equipment">Equipment</Label>
                <Select value={selectedEquipmentId} onValueChange={setSelectedEquipmentId}>
                  <SelectTrigger id="tool-equipment">
                    <SelectValue placeholder="Select equipment" />
                  </SelectTrigger>
                  <SelectContent>
                    {equipment.map((item) => (
                      <SelectItem key={item.id} value={item.id.toString()}>
                        {item.name} ({item.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tool-type">Form Type</Label>
                <Select value={signatureType} onValueChange={(value) => setSignatureType(value as SignatureType)}>
                  <SelectTrigger id="tool-type">
                    <SelectValue placeholder="Select form type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="agreement">Agreement</SelectItem>
                    <SelectItem value="checklist">Checklist</SelectItem>
                    <SelectItem value="return">Return</SelectItem>
                    <SelectItem value="receipt">Receipt</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => createSignatureLink.mutate()} disabled={createSignatureLink.isPending}>
                <Link2 className="mr-2 h-4 w-4" />
                {createSignatureLink.isPending ? "Generating..." : "Generate Link"}
              </Button>
            </div>

            {generatedLink && (
              <div className="rounded border border-dashed p-3 text-sm">
                <div className="text-xs text-muted-foreground">Latest link</div>
                <div className="break-all font-medium">{generatedLink}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Links</CardTitle>
            <CardDescription>Last 5 generated signature links</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentLinks.map((link) => (
              <div key={link.url} className="rounded border p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium capitalize">{link.type}</div>
                  <Badge variant="outline">{new Date(link.createdAt).toLocaleDateString()}</Badge>
                </div>
                <div className="mt-2 break-all text-xs text-muted-foreground">{link.url}</div>
              </div>
            ))}
            {recentLinks.length === 0 && (
              <div className="py-6 text-center text-sm text-muted-foreground">
                No links generated yet.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Equipment Inventory Snapshot</CardTitle>
          <CardDescription>Quick reference for available equipment</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {equipment.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded border p-3">
              <div className="flex items-center gap-2">
                <Wrench className="h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs text-muted-foreground">{item.type}</div>
                </div>
              </div>
              <Badge variant="outline" className="capitalize">
                {item.status}
              </Badge>
            </div>
          ))}
          {equipment.length === 0 && (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No equipment available.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

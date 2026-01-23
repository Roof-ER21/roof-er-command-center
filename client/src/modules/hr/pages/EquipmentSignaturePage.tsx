import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/useToast";
import { AlertTriangle, CheckCircle } from "lucide-react";

type EquipmentSignatureType = "agreement" | "checklist" | "return" | "receipt";

interface EquipmentItem {
  id: number;
  name: string;
  type: string;
  serialNumber?: string;
}

interface EquipmentToken {
  token: string;
  type: EquipmentSignatureType;
  status: "pending" | "signed";
  equipment: EquipmentItem | null;
}

interface EquipmentSignaturePageProps {
  title: string;
  description: string;
  expectedType: EquipmentSignatureType;
}

export function EquipmentSignaturePage({ title, description, expectedType }: EquipmentSignaturePageProps) {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [signerName, setSignerName] = useState("");
  const [signerEmail, setSignerEmail] = useState("");
  const [signature, setSignature] = useState("");
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, error } = useQuery<EquipmentToken>({
    queryKey: ["/api/public/equipment", token],
    queryFn: async () => {
      const response = await fetch(`/api/public/equipment/${token}`);
      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody?.error || "Failed to load equipment");
      }
      return response.json();
    },
    enabled: !!token,
    retry: false,
  });

  const signMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/public/equipment/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerName,
          signerEmail,
          signature: signature || signerName,
          notes,
        }),
      });
      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody?.error || "Failed to sign equipment form");
      }
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Signature recorded",
        description: "Thank you for completing the form.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to submit signature",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="p-8">Loading equipment form...</div>;
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Form unavailable</CardTitle>
            <CardDescription>{(error as Error)?.message || "Invalid or expired link."}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isSigned = submitted || data.status === "signed";
  const typeMismatch = data.type !== expectedType;

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {typeMismatch && (
              <div className="flex items-center gap-2 rounded border border-yellow-200 bg-yellow-50 p-3 text-yellow-700">
                <AlertTriangle className="h-4 w-4" />
                This link is for a {data.type} form. Continue if that matches your intent.
              </div>
            )}
            <div className="rounded border bg-white p-3">
              <div className="font-medium">{data.equipment?.name || "Equipment item"}</div>
              <div className="text-xs text-muted-foreground">{data.equipment?.type || "Type unavailable"}</div>
              {data.equipment?.serialNumber && (
                <div className="text-xs text-muted-foreground">Serial: {data.equipment.serialNumber}</div>
              )}
            </div>
            <Badge variant="outline" className="capitalize">
              {data.status}
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Signature
            </CardTitle>
            <CardDescription>Complete the fields below to submit</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSigned ? (
              <div className="rounded border border-dashed p-4 text-sm text-muted-foreground">
                This form has already been signed.
              </div>
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="signer-name">Full Name</Label>
                    <Input
                      id="signer-name"
                      value={signerName}
                      onChange={(event) => setSignerName(event.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="signer-email">Email</Label>
                    <Input
                      id="signer-email"
                      value={signerEmail}
                      onChange={(event) => setSignerEmail(event.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="signature">Signature (typed)</Label>
                  <Input
                    id="signature"
                    value={signature}
                    onChange={(event) => setSignature(event.target.value)}
                    placeholder="Type your full name"
                  />
                </div>
                <div>
                  <Label htmlFor="signature-notes">Notes</Label>
                  <Textarea
                    id="signature-notes"
                    value={notes}
                    onChange={(event) => setNotes(event.target.value)}
                    rows={3}
                  />
                </div>
                <Button
                  onClick={() => signMutation.mutate()}
                  disabled={signMutation.isPending || !signerName.trim()}
                >
                  {signMutation.isPending ? "Submitting..." : "Submit Signature"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

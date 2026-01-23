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
import { CheckCircle, FileText } from "lucide-react";

interface PublicContract {
  id: number;
  title: string;
  content: string;
  status: string;
}

export function PublicContractPage() {
  const { token } = useParams<{ token: string }>();
  const { toast } = useToast();
  const [signerName, setSignerName] = useState("");
  const [signature, setSignature] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const { data, isLoading, error } = useQuery<PublicContract>({
    queryKey: ["/api/public/contracts", token],
    queryFn: async () => {
      const response = await fetch(`/api/public/contracts/${token}`);
      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody?.error || "Failed to load contract");
      }
      return response.json();
    },
    enabled: !!token,
    retry: false,
  });

  const signMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/public/contracts/${token}/sign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signerName,
          signature: signature || signerName,
        }),
      });
      if (!response.ok) {
        const errorBody = await response.json();
        throw new Error(errorBody?.error || "Failed to sign contract");
      }
      return response.json();
    },
    onSuccess: () => {
      setSubmitted(true);
      toast({
        title: "Contract signed",
        description: "Your signature has been recorded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to sign contract",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return <div className="p-8">Loading contract...</div>;
  }

  if (error || !data) {
    return (
      <div className="p-8">
        <Card>
          <CardHeader>
            <CardTitle>Contract not available</CardTitle>
            <CardDescription>{(error as Error)?.message || "Invalid or expired link."}</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const isSigned = submitted || data.status === "SIGNED";

  return (
    <div className="min-h-screen bg-muted/30 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {data.title}
            </CardTitle>
            <CardDescription>Review and sign your contract</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded border bg-white p-4 text-sm whitespace-pre-wrap">
              {data.content || "Contract content unavailable."}
            </div>
            <Badge variant="outline">{data.status}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Signature
            </CardTitle>
            <CardDescription>Confirm your name to sign electronically</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSigned ? (
              <div className="rounded border border-dashed p-4 text-sm text-muted-foreground">
                This contract has already been signed. Thank you!
              </div>
            ) : (
              <>
                <div>
                  <Label htmlFor="signer-name">Full Name</Label>
                  <Input
                    id="signer-name"
                    value={signerName}
                    onChange={(event) => setSignerName(event.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="signature">Signature (typed)</Label>
                  <Textarea
                    id="signature"
                    value={signature}
                    onChange={(event) => setSignature(event.target.value)}
                    rows={2}
                    placeholder="Type your full name"
                  />
                </div>
                <Button
                  onClick={() => signMutation.mutate()}
                  disabled={signMutation.isPending || !signerName.trim()}
                >
                  {signMutation.isPending ? "Submitting..." : "Sign Contract"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

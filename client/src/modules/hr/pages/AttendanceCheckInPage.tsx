import { useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/useToast";
import { CheckCircle, XCircle } from "lucide-react";

export function AttendanceCheckInPage({ embedded = false }: { embedded?: boolean }) {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session");

  const checkInMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/hr/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ sessionId }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to check in");
      }
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Checked in",
        description: "Your attendance has been recorded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to check in",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (sessionId) {
      checkInMutation.mutate();
    }
  }, [sessionId, checkInMutation]);

  if (!sessionId) {
    return (
      <div className={embedded ? "" : "p-8"}>
        <Card>
          <CardHeader>
            <CardTitle>Missing session</CardTitle>
            <CardDescription>Scan a valid QR code to check in.</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const content = (
    <Card className="max-w-md w-full">
      <CardHeader>
        <CardTitle>Attendance Check-In</CardTitle>
        <CardDescription>Session #{sessionId}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        {checkInMutation.isPending && <div>Recording your check-in...</div>}
        {checkInMutation.isSuccess && (
          <div className="flex flex-col items-center gap-2">
            <CheckCircle className="h-10 w-10 text-green-600" />
            <div className="text-sm text-muted-foreground">Check-in confirmed.</div>
          </div>
        )}
        {checkInMutation.isError && (
          <div className="flex flex-col items-center gap-2">
            <XCircle className="h-10 w-10 text-red-600" />
            <div className="text-sm text-muted-foreground">
              Unable to check in. Please try again.
            </div>
            <Button variant="outline" onClick={() => checkInMutation.mutate()}>
              Retry
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6 flex items-center justify-center">
      {content}
    </div>
  );
}

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Calendar, KeyRound } from "lucide-react";

interface GoogleIntegrationStatus {
  calendarConfigured: boolean;
  serviceAccountEmail?: string | null;
  genAiConfigured: boolean;
}

export function GoogleIntegrationPage() {
  const { data, isLoading } = useQuery<GoogleIntegrationStatus>({
    queryKey: ["/api/hr/google-integration/status"],
    queryFn: async () => {
      const response = await fetch("/api/hr/google-integration/status", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch Google integration status");
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="p-8">Loading integration status...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Google Integration</h1>
        <p className="text-muted-foreground">Configure Google services for HR workflows</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Calendar Integration
            </CardTitle>
            <CardDescription>Sync meetings and PTO to Google Calendar</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant={data?.calendarConfigured ? "default" : "secondary"}>
              {data?.calendarConfigured ? "Configured" : "Not Configured"}
            </Badge>
            <div className="text-sm text-muted-foreground">
              Service account: {data?.serviceAccountEmail || "Not set"}
            </div>
            <div className="text-xs text-muted-foreground">
              Set `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `GOOGLE_PRIVATE_KEY` in your environment to enable sync.
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-primary" />
              GenAI Access
            </CardTitle>
            <CardDescription>Used by Susan/Agnes AI features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Badge variant={data?.genAiConfigured ? "default" : "secondary"}>
              {data?.genAiConfigured ? "Configured" : "Missing API Key"}
            </Badge>
            <div className="text-xs text-muted-foreground">
              Add `GOOGLE_GENAI_API_KEY` to unlock AI workflows.
            </div>
            <Button asChild variant="outline" size="sm">
              <Link to="/hr/susan-ai-admin">Open Susan AI Admin</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

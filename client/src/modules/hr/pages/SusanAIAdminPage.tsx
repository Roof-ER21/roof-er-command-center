import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/useToast";
import { Bot, MessageSquare, Sparkles } from "lucide-react";

interface ChatHistorySession {
  id: string;
  title: string;
  preview: string;
  messageCount: number;
  lastMessageAt: string;
  provider?: string;
  state?: string | null;
}

export function SusanAIAdminPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [prompt, setPrompt] = useState("");
  const [response, setResponse] = useState("");
  const hasFieldAccess = !!user?.hasFieldAccess;

  const { data: chatHistory } = useQuery<ChatHistorySession[]>({
    queryKey: ["/api/field/chat/history"],
    queryFn: async () => {
      const response = await fetch("/api/field/chat/history", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch chat history");
      const payload = await response.json();
      return payload?.data?.sessions || [];
    },
    retry: false,
    enabled: hasFieldAccess,
  });

  const testPromptMutation = useMutation({
    mutationFn: async () => {
      if (!hasFieldAccess) {
        throw new Error("Field module access is required to test Susan.");
      }
      if (!prompt.trim()) {
        throw new Error("Enter a prompt to test Susan");
      }
      const sessionResponse = await fetch("/api/field/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ state: "admin-test", provider: "gemini" }),
      });
      if (!sessionResponse.ok) {
        const error = await sessionResponse.json();
        throw new Error(error?.error || "Unable to create chat session");
      }
      const sessionPayload = await sessionResponse.json();
      const sessionId = sessionPayload?.data?.sessionId;
      if (!sessionId) {
        throw new Error("Missing chat session ID");
      }

      const messageResponse = await fetch(`/api/field/chat/${sessionId}/message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: prompt }),
      });
      if (!messageResponse.ok) {
        const error = await messageResponse.json();
        throw new Error(error?.error || "Susan AI failed to respond");
      }
      const messagePayload = await messageResponse.json();
      return messagePayload?.data?.response || "No response returned.";
    },
    onSuccess: (data) => {
      setResponse(data);
      toast({
        title: "Susan responded",
        description: "Test response captured.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to run Susan test",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Susan AI Admin</h1>
        <p className="text-muted-foreground">Test and monitor Susan AI field assistant</p>
      </div>

      {!hasFieldAccess && (
        <Card>
          <CardHeader>
            <CardTitle>Field Access Required</CardTitle>
            <CardDescription>
              Enable Field module access to run Susan tests and view chat history.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Test Prompt
            </CardTitle>
            <CardDescription>Send a quick message to validate responses</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Ask Susan a field-related question..."
              rows={5}
            />
            <Button
              onClick={() => testPromptMutation.mutate()}
              disabled={!hasFieldAccess || testPromptMutation.isPending}
            >
              <Bot className="mr-2 h-4 w-4" />
              {testPromptMutation.isPending ? "Sending..." : "Run Test"}
            </Button>
            {response && (
              <div className="rounded border bg-muted/40 p-3 text-sm">
                <div className="text-xs text-muted-foreground">Latest response</div>
                <div className="mt-1 whitespace-pre-wrap">{response}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-primary" />
              Recent Chat Sessions
            </CardTitle>
            <CardDescription>Most recent Susan conversations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {(chatHistory || []).map((session) => (
              <div key={session.id} className="rounded border p-3 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-medium">{session.title}</div>
                  <Badge variant="outline">{session.provider || "gemini"}</Badge>
                </div>
                <div className="text-xs text-muted-foreground">{session.preview}</div>
                <div className="text-xs text-muted-foreground">
                  {new Date(session.lastMessageAt).toLocaleString()} • {session.messageCount} messages
                </div>
              </div>
            ))}
            {(chatHistory || []).length === 0 && (
              <div className="text-sm text-muted-foreground">No chat history available.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Copy, Send } from "lucide-react";

export function EmailGeneratorPage() {
  const templates = [
    { id: 1, name: "Initial Contact", description: "First reach out to homeowner" },
    { id: 2, name: "Follow Up", description: "After inspection" },
    { id: 3, name: "Insurance Update", description: "Claim status update" },
    { id: 4, name: "Scheduling", description: "Schedule appointment" },
    { id: 5, name: "Thank You", description: "Post-completion gratitude" },
    { id: 6, name: "Custom", description: "AI-generated custom email" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Email Generator</h1>
        <p className="text-muted-foreground">Create professional emails with AI assistance</p>
      </div>

      {/* Template selection */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => (
          <Card key={template.id} className="hover:bg-muted/50 transition-colors cursor-pointer">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {template.name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{template.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Generated email preview */}
      <Card>
        <CardHeader>
          <CardTitle>Generated Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Subject</label>
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">Select a template to generate an email</p>
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Body</label>
            <div className="p-3 bg-muted rounded-md min-h-[200px]">
              <p className="text-sm text-muted-foreground">
                Email content will appear here after selecting a template and providing details.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1">
              <Copy className="mr-2 h-4 w-4" />
              Copy
            </Button>
            <Button className="flex-1">
              <Send className="mr-2 h-4 w-4" />
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

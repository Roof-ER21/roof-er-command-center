import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CoachModePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coach Mode</h1>
        <p className="text-muted-foreground">AI-guided learning and coaching</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>AI Coach</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Coach mode interface will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

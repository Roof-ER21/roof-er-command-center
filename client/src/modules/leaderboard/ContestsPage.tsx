import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ContestsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contests</h1>
        <p className="text-muted-foreground">Active competitions and prizes</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Contests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Contests will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

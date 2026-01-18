import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SalesLeaderboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sales Rankings</h1>
        <p className="text-muted-foreground">Current standings and performance metrics</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Sales rankings will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

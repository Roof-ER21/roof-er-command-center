import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "lucide-react";

export function PTOPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PTO Requests</h1>
          <p className="text-muted-foreground">Review and manage time off requests</p>
        </div>
        <Button>
          <Calendar className="mr-2 h-4 w-4" />
          Request Time Off
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Pending Requests</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">PTO requests will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Briefcase } from "lucide-react";

export function RecruitingPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Recruiting</h1>
          <p className="text-muted-foreground">Manage candidates and job postings</p>
        </div>
        <Button>
          <Briefcase className="mr-2 h-4 w-4" />
          New Position
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Active Candidates</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Candidate pipeline will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
}

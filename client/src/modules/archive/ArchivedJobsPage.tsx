import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, Archive, Search, MapPin, RotateCcw, Copy } from "lucide-react";

export function ArchivedJobsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Archived Jobs</h1>
          <p className="text-muted-foreground">Read-only archive of all completed/discharged jobs with search and reopen capability</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Search className="h-4 w-4" /> Search & Filter</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">By date range, branch, rep, customer, job type. Table, Card, and Map views</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><RotateCcw className="h-4 w-4" /> Reopen for Warranty</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Create new linked job referencing original — Service/Warranty Manager role only</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Copy className="h-4 w-4" /> Duplicate Customer</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">New job with same customer info but fresh stage pipeline</p></CardContent>
        </Card>
      </div>
    </div>
  );
}

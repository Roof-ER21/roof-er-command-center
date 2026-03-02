import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, ClipboardCheck, Camera, FileText, CalendarDays } from "lucide-react";

export function QualityInspectionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Quality Inspections</h1>
          <p className="text-muted-foreground">Schedule QC, per-trade checklists, pass/fail scoring, PDF reports</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><CalendarDays className="h-4 w-4" /> Schedule QC</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Pick field tech, date/time with Google Calendar sync</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ClipboardCheck className="h-4 w-4" /> Checklist Templates</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Per-trade inspection items (roofing, siding, gutters) with pass/fail + notes</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> PDF Reports</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Auto-generated with photos, checklist results, overall grade</p></CardContent>
        </Card>
      </div>
    </div>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, DollarSign, Users, LayoutTemplate, Upload } from "lucide-react";

export function PricingLibraryPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Pricing Library</h1>
          <p className="text-muted-foreground">Company pricing catalog, sub price lists, and material templates</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" /> Company Pricing</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Master catalog: materials, labor, upgrades, custom items, discounts. Auto-margin calc with validation (must be &gt;20%)</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Users className="h-4 w-4" /> Sub Price Lists</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Per-sub private pricing: labor rates, material markups, flat fees. CSV import/export per sub</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><LayoutTemplate className="h-4 w-4" /> Template Manager</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Standard / Better / Premium material templates by trade and job type. 4-step wizard to create/edit</p></CardContent>
        </Card>
      </div>
    </div>
  );
}

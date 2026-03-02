import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, Package, Ruler, Truck, DollarSign } from "lucide-react";

export function MaterialTrackerPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Material / Bid-Item Tracker</h1>
          <p className="text-muted-foreground">Siding take-offs, bid items, supplier management, and auto-pricing</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Ruler className="h-4 w-4" /> Siding Take-Offs</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Siding-specific material calculations</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" /> Bid Items</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">All other material categories with Pricing Library integration</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Truck className="h-4 w-4" /> Status Flow</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Draft → In Review → Approved → Ordered → Delivered → Rejected</p></CardContent>
        </Card>
      </div>
    </div>
  );
}

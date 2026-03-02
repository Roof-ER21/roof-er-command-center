import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, Shield, Users, Eye, Lock } from "lucide-react";

const roles = [
  "Sales Rep", "Retail Canvasser", "Retail Closer", "Project Coordinator", "Project Manager",
  "Field Tech", "Supplementer", "Senior Estimator", "A/R Manager", "Call Center Employee",
  "Service/Warranty Manager", "Subcontractor", "Admin", "Owner"
];

export function RolesPermissionsPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Roles & Permissions</h1>
          <p className="text-muted-foreground">14 roles with granular permission matrix — View, Edit, Create, Delete, Approve, Export</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {roles.map((role) => (
          <Card key={role} className="border-dashed">
            <CardContent className="py-3">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">{role}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Eye className="h-4 w-4" /> Permission Preview</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Simulate what a user sees with grayed-out UI mockup</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Lock className="h-4 w-4" /> Audit Log</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">All permission changes logged — who changed what, when</p></CardContent>
        </Card>
      </div>
    </div>
  );
}

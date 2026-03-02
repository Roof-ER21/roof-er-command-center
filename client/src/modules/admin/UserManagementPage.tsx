import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, UserPlus, Shield, MapPin, KeyRound } from "lucide-react";

export function UserManagementPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground">Create, edit, deactivate, and manage user accounts and access</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><UserPlus className="h-4 w-4" /> User CRUD</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Create, edit, deactivate, delete users</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Shield className="h-4 w-4" /> Role Assignment</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Assign from 14 CRM roles</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><MapPin className="h-4 w-4" /> Branch/Territory</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Assign branch and territory, employment type (W2/1099/Sub)</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><KeyRound className="h-4 w-4" /> Credentials</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Login credentials and 2FA settings</p></CardContent>
        </Card>
      </div>
    </div>
  );
}

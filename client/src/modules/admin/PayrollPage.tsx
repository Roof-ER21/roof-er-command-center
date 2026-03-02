import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, DollarSign, UserCog, TrendingUp, Calculator } from "lucide-react";

export function PayrollPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payroll & Compensation</h1>
          <p className="text-muted-foreground">Commission tracking, tier-based bonuses, and payroll processing</p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><UserCog className="h-4 w-4" /> Customize by Employee</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Override default commission rules per person (special rates for top performers)</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" /> Monthly Minimums</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Set minimum payout thresholds — draw system if rep earns less</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Prior Month Sign-ups</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Track sign-ups from previous month that affect current tier/bonus</p></CardContent>
        </Card>
        <Card className="border-dashed">
          <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Calculator className="h-4 w-4" /> Commission Tracker</CardTitle></CardHeader>
          <CardContent><p className="text-sm text-muted-foreground">Job #, Role/User, Pending/Earned amounts, Process Commissions, Run Payroll Preview, QuickBooks/Gusto sync</p></CardContent>
        </Card>
      </div>
    </div>
  );
}

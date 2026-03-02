import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Construction, Stethoscope, Activity, HeartPulse, Syringe, Scissors, Pill, LogOut as Discharge, Scale } from "lucide-react";

const categories = [
  { name: "Active Leads", metaphor: "Triage", color: "bg-blue-500/10 border-blue-500/30 text-blue-700", icon: Stethoscope, count: 0 },
  { name: "Claim Filed", metaphor: "Diagnosis", color: "bg-purple-500/10 border-purple-500/30 text-purple-700", icon: Activity, count: 0 },
  { name: "Claim Result", metaphor: "Critical Care", color: "bg-orange-500/10 border-orange-500/30 text-orange-700", icon: HeartPulse, count: 0 },
  { name: "Pre-Op", metaphor: "Pre-Op", color: "bg-yellow-500/10 border-yellow-500/30 text-yellow-700", icon: Syringe, count: 0 },
  { name: "Operating Room", metaphor: "Operating Room", color: "bg-green-500/10 border-green-500/30 text-green-700", icon: Scissors, count: 0 },
  { name: "Post-Op", metaphor: "Post-Op", color: "bg-teal-500/10 border-teal-500/30 text-teal-700", icon: Pill, count: 0 },
  { name: "Discharge", metaphor: "Discharge", color: "bg-gray-500/10 border-gray-500/30 text-gray-700", icon: Discharge, count: 0 },
  { name: "Legal Hold", metaphor: "Legal Hold", color: "bg-red-500/10 border-red-500/30 text-red-700", icon: Scale, count: 0 },
];

export function JobsDashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Jobs Dashboard</h1>
          <p className="text-muted-foreground">
            8 master categories with insurance (19 substages) and retail (12 substages) pipelines
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      {/* Filter bar placeholder */}
      <Card className="border-dashed">
        <CardContent className="py-3">
          <p className="text-sm text-muted-foreground">
            Filter bar: Branch, Rep, Date Range, Job Type (Insurance / Retail)
          </p>
        </CardContent>
      </Card>

      {/* 8 Master Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((cat) => (
          <Card key={cat.name} className={`border-dashed cursor-pointer hover:shadow-md transition-shadow ${cat.color}`}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <cat.icon className="h-4 w-4" />
                  {cat.name}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">{cat.count}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">{cat.metaphor}</p>
              <p className="text-xs text-muted-foreground mt-1">Click to view substages →</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

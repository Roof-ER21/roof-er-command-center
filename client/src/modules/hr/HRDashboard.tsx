import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Calendar, Briefcase, Wrench, UserPlus, FileText, ArrowRight } from "lucide-react";

export function HRDashboard() {
  const cards = [
    { title: "Employees", description: "Manage team members", icon: Users, href: "/hr/employees", count: 45 },
    { title: "PTO Requests", description: "Review time off", icon: Calendar, href: "/hr/pto", count: 5, badge: "pending" },
    { title: "Recruiting", description: "Open positions & candidates", icon: Briefcase, href: "/hr/recruiting", count: 12 },
    { title: "Equipment", description: "Inventory & assignments", icon: Wrench, href: "/hr/equipment", count: 89 },
    { title: "Onboarding", description: "New hire checklists", icon: UserPlus, href: "/hr/onboarding", count: 3 },
    { title: "Contracts", description: "Documents & agreements", icon: FileText, href: "/hr/contracts", count: 156 },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">HR Management</h1>
          <p className="text-muted-foreground">Manage your team and HR operations</p>
        </div>
        <Button asChild>
          <Link to="/hr/employees/new">
            <UserPlus className="mr-2 h-4 w-4" />
            Add Employee
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link key={card.title} to={card.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer group">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.count}</div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

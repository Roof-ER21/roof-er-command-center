import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UsersRound, GitBranch, UserCog, User, LayoutDashboard, ArrowRight } from "lucide-react";

const sections = [
  {
    id: "employees",
    label: "Employees",
    icon: Users,
    href: "/hr/employees",
    description: "Manage employee records and profiles"
  },
  {
    id: "directory",
    label: "Team Directory",
    icon: UsersRound,
    href: "/hr/team-directory",
    description: "Search and browse the company directory"
  },
  {
    id: "org-chart",
    label: "Org Chart",
    icon: GitBranch,
    href: "/hr/org-chart",
    description: "View organizational hierarchy"
  },
  {
    id: "dashboard",
    label: "Team Dashboard",
    icon: LayoutDashboard,
    href: "/hr/team-dashboard",
    description: "Team metrics and insights"
  },
  {
    id: "assignments",
    label: "Assignments",
    icon: UserCog,
    href: "/hr/employee-assignments",
    description: "Manager and team assignments"
  },
  {
    id: "portal",
    label: "Employee Portal",
    icon: User,
    href: "/hr/employee-portal",
    description: "Employee self-service portal"
  },
];

export function PeoplePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "employees";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">People</h1>
        <p className="text-muted-foreground">Manage employees, teams, and organizational structure</p>
      </div>

      <Tabs value={activeTab} className="space-y-6">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {sections.map((section) => (
            <TabsTrigger
              key={section.id}
              value={section.id}
              className="flex items-center gap-2"
              onClick={() => navigate(section.href)}
            >
              <section.icon className="h-4 w-4" />
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {sections.map((section) => (
          <Card
            key={section.id}
            className="cursor-pointer hover:border-primary/50 transition-colors"
            onClick={() => navigate(section.href)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <section.icon className="h-8 w-8 text-primary" />
                <ArrowRight className="h-4 w-4 text-muted-foreground" />
              </div>
              <CardTitle className="text-lg">{section.label}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>
    </div>
  );
}

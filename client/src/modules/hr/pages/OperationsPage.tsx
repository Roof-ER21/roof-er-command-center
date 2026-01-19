import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardList, TrendingUp, GitBranch, MapPin, Wrench, ArrowRight } from "lucide-react";

const sections = [
  {
    id: "tasks",
    label: "Tasks",
    icon: ClipboardList,
    href: "/hr/tasks",
    description: "Manage HR tasks and projects"
  },
  {
    id: "reviews",
    label: "Reviews",
    icon: TrendingUp,
    href: "/hr/reviews",
    description: "Employee performance reviews"
  },
  {
    id: "workflows",
    label: "Workflows",
    icon: GitBranch,
    href: "/hr/workflows",
    description: "Build and manage HR workflows"
  },
  {
    id: "territories",
    label: "Territories",
    icon: MapPin,
    href: "/hr/territories",
    description: "Manage sales territories"
  },
  {
    id: "tools",
    label: "Tools",
    icon: Wrench,
    href: "/hr/tools",
    description: "HR utility tools"
  },
];

export function OperationsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "tasks";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Operations</h1>
        <p className="text-muted-foreground">Manage HR operations, tasks, and workflows</p>
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

import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart3, ShieldCheck, TrendingUp, ArrowRight } from "lucide-react";

const sections = [
  {
    id: "enterprise",
    label: "Enterprise Analytics",
    icon: BarChart3,
    href: "/hr/enterprise-analytics",
    description: "Company-wide HR metrics and insights"
  },
  {
    id: "safety",
    label: "Safety Dashboard",
    icon: ShieldCheck,
    href: "/hr/safety",
    description: "Safety metrics and incident tracking"
  },
  {
    id: "roadmap",
    label: "Roadmap",
    icon: TrendingUp,
    href: "/hr/roadmap",
    description: "HR initiatives and project roadmap"
  },
];

export function AnalyticsPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "enterprise";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">HR metrics, safety tracking, and strategic planning</p>
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

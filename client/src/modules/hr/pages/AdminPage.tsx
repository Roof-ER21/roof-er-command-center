import { useNavigate, useSearchParams } from "react-router-dom";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Bot, FileText, KeyRound, ArrowRight } from "lucide-react";

const sections = [
  {
    id: "hub",
    label: "Admin Hub",
    icon: Settings,
    href: "/hr/admin-hub",
    description: "Central admin control panel"
  },
  {
    id: "susan",
    label: "Susan AI",
    icon: Bot,
    href: "/hr/susan-ai-admin",
    description: "Configure AI assistant settings"
  },
  {
    id: "reports",
    label: "Scheduled Reports",
    icon: FileText,
    href: "/hr/scheduled-reports",
    description: "Manage automated report generation"
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: KeyRound,
    href: "/hr/google-integration",
    description: "Google Workspace and external integrations"
  },
];

export function AdminPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "hub";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin</h1>
        <p className="text-muted-foreground">System administration, AI settings, and integrations</p>
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

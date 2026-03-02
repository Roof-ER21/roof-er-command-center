import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Construction, Eye, Camera, FileCheck, Receipt, Calendar, FileText, MessageSquare, DollarSign, ClipboardList } from "lucide-react";

const tabs = [
  { id: "overview", label: "Overview", icon: Eye, description: "Customer info, job metadata, current stage, scope summary, revenue summary" },
  { id: "photos", label: "Photos", icon: Camera, description: "Grid gallery organized by category: Before, During, After, QC, Damage" },
  { id: "claim", label: "Claim Result", icon: FileCheck, description: "Carrier estimate upload, outcome selection, supplement history (insurance only)" },
  { id: "invoice", label: "Invoice", icon: Receipt, description: "All invoices, QuickBooks sync, change orders, discounts, revenue recognition" },
  { id: "production", label: "Schedule / Production", icon: Calendar, description: "Measurements, material orders, crew assignment, install calendar, checklists" },
  { id: "documents", label: "Documents", icon: FileText, description: "Contracts, signed specs, carrier estimates, QC reports, COCs, Adobe Sign status" },
  { id: "notes", label: "Notes & Activity", icon: ClipboardList, description: "Chronological activity log, user-added notes with photos, filter by type" },
  { id: "messages", label: "Message Board", icon: MessageSquare, description: "Per-job threaded messaging with @mentions and SLA tracking" },
  { id: "commission", label: "Commission / Profit", icon: DollarSign, description: "Revenue breakdown, per-role commission, pending vs earned, job profit calc" },
];

export function JobDetailPage() {
  const { jobId } = useParams();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Job Detail — #{jobId || "..."}</h1>
          <p className="text-muted-foreground">
            Central hub for managing all aspects of a job (9 tabs)
          </p>
        </div>
        <Badge variant="outline" className="gap-1">
          <Construction className="h-3 w-3" /> Coming Soon
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="flex flex-wrap h-auto gap-1">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="gap-1 text-xs">
              <tab.icon className="h-3 w-3" />
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {tabs.map((tab) => (
          <TabsContent key={tab.id} value={tab.id}>
            <Card className="border-dashed">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{tab.description}</p>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { usePermissions } from "@/hooks/usePermissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Building, Users, User, RefreshCw, Save } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function PtoPoliciesPage({ embedded = false }: { embedded?: boolean }) {
  const { toast } = useToast();
  const { isAdmin } = usePermissions();
  const queryClient = useQueryClient();
  const [selectedPolicyTab, setSelectedPolicyTab] = useState("company");

  const { data: companyPolicy, isLoading: loadingCompany } = useQuery<any>({
    queryKey: ["/api/hr/pto/policies/company-policy"],
    queryFn: async () => {
      const res = await fetch("/api/hr/pto/policies/company-policy", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch company policy");
      return res.json();
    }
  });

  const { data: individualPolicies, isLoading: loadingIndividual } = useQuery<any[]>({
    queryKey: ["/api/hr/pto/policies/individual-policies"],
    queryFn: async () => {
      const res = await fetch("/api/hr/pto/policies/individual-policies", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch individual policies");
      return res.json();
    }
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/employees"],
    queryFn: async () => {
      const res = await fetch("/api/hr/employees", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch employees");
      return res.json();
    }
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch("/api/hr/pto/policies/company-policy", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/pto/policies/company-policy"] });
      toast({ title: "Updated", description: "Company policy saved." });
    }
  });

  const resetAllMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/hr/pto/policies/admin/reset-all", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw new Error("Reset failed");
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/pto/policies/individual-policies"] });
      toast({ title: "Reset Complete", description: data.message });
    }
  });

  if (loadingCompany || loadingIndividual) {
    return <Skeleton className="h-[400px] w-full" />;
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">PTO Policies</h1>
            <p className="text-muted-foreground">Manage PTO allocations and rules</p>
          </div>
          {isAdmin() && (
            <Button variant="outline" onClick={() => resetAllMutation.mutate()} disabled={resetAllMutation.isPending}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Initialize All Policies
            </Button>
          )}
        </div>
      )}

      <Tabs value={selectedPolicyTab} onValueChange={setSelectedPolicyTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="company" className="gap-2">
            <Building className="h-4 w-4" />
            Company
          </TabsTrigger>
          <TabsTrigger value="individual" className="gap-2">
            <User className="h-4 w-4" />
            Individual
          </TabsTrigger>
        </TabsList>

        <TabsContent value="company">
          <Card>
            <CardHeader>
              <CardTitle>Standard Allocation</CardTitle>
              <CardDescription>Default PTO days for eligible employees</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                updateCompanyMutation.mutate({
                  vacationDays: parseInt(formData.get("vacation") as string),
                  sickDays: parseInt(formData.get("sick") as string),
                  personalDays: parseInt(formData.get("personal") as string),
                  totalDays: parseInt(formData.get("vacation") as string) + 
                             parseInt(formData.get("sick") as string) + 
                             parseInt(formData.get("personal") as string),
                });
              }} className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="vacation">Vacation Days</Label>
                    <Input id="vacation" name="vacation" type="number" defaultValue={companyPolicy?.vacationDays || 10} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sick">Sick Days</Label>
                    <Input id="sick" name="sick" type="number" defaultValue={companyPolicy?.sickDays || 5} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="personal">Personal Days</Label>
                    <Input id="personal" name="personal" type="number" defaultValue={companyPolicy?.personalDays || 2} />
                  </div>
                </div>
                {isAdmin() && (
                  <div className="flex justify-end">
                    <Button type="submit" disabled={updateCompanyMutation.isPending}>
                      <Save className="mr-2 h-4 w-4" />
                      Save Changes
                    </Button>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="individual">
          <Card>
            <CardHeader>
              <CardTitle>Employee Policies</CardTitle>
              <CardDescription>Custom PTO overrides for specific team members</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Employee</th>
                      <th className="text-center py-3 px-4">Level</th>
                      <th className="text-center py-3 px-4">Total</th>
                      <th className="text-center py-3 px-4">Used</th>
                      <th className="text-center py-3 px-4">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {individualPolicies?.map((policy) => {
                      const employee = employees.find(e => e.id === policy.employeeId);
                      return (
                        <tr key={policy.id} className="border-b hover:bg-muted/50">
                          <td className="py-3 px-4">
                            <div className="font-medium">{employee ? `${employee.firstName} ${employee.lastName}` : "Unknown"}</div>
                            <div className="text-xs text-muted-foreground">{employee?.email}</div>
                          </td>
                          <td className="text-center py-3 px-4">
                            <Badge variant="outline">{policy.policyLevel}</Badge>
                          </td>
                          <td className="text-center py-3 px-4 font-bold">{policy.totalDays}d</td>
                          <td className="text-center py-3 px-4 text-amber-600">{policy.usedDays}d</td>
                          <td className="text-center py-3 px-4 text-green-600 font-bold">{policy.remainingDays}d</td>
                        </tr>
                      );
                    })}
                    {individualPolicies?.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-muted-foreground">
                          No custom policies defined. Initialize to create defaults.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
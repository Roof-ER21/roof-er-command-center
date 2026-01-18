import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link2, Package, Plus, Search } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/useToast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLocation, useSearchParams } from "react-router-dom";

interface EquipmentItem {
  id: number;
  name: string;
  type: string;
  serialNumber?: string;
  assignedTo?: number | null;
  status: "available" | "assigned" | "maintenance" | "retired";
  purchaseDate?: string;
  purchasePrice?: string;
  notes?: string;
}

type SignatureType = "agreement" | "checklist" | "return" | "receipt";

const signatureRoutes: Record<SignatureType, string> = {
  agreement: "/public/equipment-agreement",
  checklist: "/public/equipment-checklist",
  return: "/public/equipment-return",
  receipt: "/public/equipment-receipt",
};

export function EquipmentPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | EquipmentItem["status"]>("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isLinkDialogOpen, setIsLinkDialogOpen] = useState(false);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const [signatureType, setSignatureType] = useState<SignatureType>("agreement");
  const [generatedLink, setGeneratedLink] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    type: "",
    serialNumber: "",
    assignedTo: "",
    status: "available",
    purchaseDate: "",
    purchasePrice: "",
    notes: "",
  });
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const tabFromQuery = searchParams.get("tab");
  const tabFromPath = location.pathname.includes("equipment-") ? "forms" : "inventory";
  const resolvedTab = tabFromQuery || tabFromPath;
  const [activeTab, setActiveTab] = useState(resolvedTab);

  useEffect(() => {
    setActiveTab(resolvedTab);
  }, [resolvedTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const onBasePath = location.pathname === "/hr/equipment";
    if (value === "inventory" && onBasePath) {
      setSearchParams({}, { replace: true });
      return;
    }
    setSearchParams({ tab: value }, { replace: true });
  };

  const signatureTypeFromPath: SignatureType | null = location.pathname.includes("equipment-checklist")
    ? "checklist"
    : location.pathname.includes("equipment-return")
      ? "return"
      : location.pathname.includes("equipment-receipt")
        ? "receipt"
        : location.pathname.includes("equipment-agreement")
          ? "agreement"
          : null;

  const { data: equipment = [], isLoading } = useQuery<EquipmentItem[]>({
    queryKey: ["/api/hr/equipment"],
    queryFn: async () => {
      const response = await fetch("/api/hr/equipment", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch equipment");
      return response.json();
    },
  });

  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ["/api/hr/employees"],
    queryFn: async () => {
      const response = await fetch("/api/hr/employees", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch employees");
      return response.json();
    },
  });

  const employeeLookup = useMemo(() => {
    return new Map(
      employees.map((emp: any) => [
        emp.id,
        `${emp.firstName || ""} ${emp.lastName || ""}`.trim() || emp.email,
      ])
    );
  }, [employees]);

  const createEquipmentMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/hr/equipment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          assignedTo: data.assignedTo ? parseInt(data.assignedTo) : null,
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create equipment");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/equipment"] });
      setIsDialogOpen(false);
      setFormData({
        name: "",
        type: "",
        serialNumber: "",
        assignedTo: "",
        status: "available",
        purchaseDate: "",
        purchasePrice: "",
        notes: "",
      });
      toast({
        title: "Equipment added",
        description: "New equipment has been added to inventory.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to add equipment",
        variant: "destructive",
      });
    },
  });

  const createSignatureLinkMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEquipmentId) {
        throw new Error("Select equipment before generating a link");
      }
      const response = await fetch(`/api/hr/equipment/${selectedEquipmentId}/token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ type: signatureType }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to generate link");
      }
      return response.json();
    },
    onSuccess: (data) => {
      const url = `${window.location.origin}${signatureRoutes[signatureType]}/${data.token}`;
      setGeneratedLink(url);
      if (navigator.clipboard) {
        navigator.clipboard.writeText(url).catch(() => undefined);
      }
      toast({
        title: "Link generated",
        description: "Signature link copied to clipboard.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to generate link",
        variant: "destructive",
      });
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "maintenance":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "retired":
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
      default:
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    }
  };

  const filteredEquipment = equipment
    .filter((item) => (statusFilter === "all" ? true : item.status === statusFilter))
    .filter((item) => {
      if (!searchTerm) return true;
      const searchValue = `${item.name} ${item.type} ${item.serialNumber || ""}`.toLowerCase();
      return searchValue.includes(searchTerm.toLowerCase());
    });

  const availableCount = equipment.filter((item) => item.status === "available").length;
  const assignedCount = equipment.filter((item) => item.status === "assigned").length;
  const maintenanceCount = equipment.filter((item) => item.status === "maintenance").length;

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type) {
      toast({
        title: "Missing fields",
        description: "Name and type are required.",
        variant: "destructive",
      });
      return;
    }
    createEquipmentMutation.mutate(formData);
  };

  const openLinkDialog = (equipmentId: number) => {
    setSelectedEquipmentId(equipmentId);
    setSignatureType(signatureTypeFromPath || "agreement");
    setGeneratedLink("");
    setIsLinkDialogOpen(true);
  };

  if (isLoading) {
    return <div className="p-8">Loading equipment...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Equipment Management</h1>
          <p className="text-muted-foreground">
            Track and manage company equipment and assets
          </p>
        </div>
        {activeTab === "inventory" && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Equipment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Add Equipment</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="type">Type</Label>
                    <Input
                      id="type"
                      value={formData.type}
                      onChange={(e) => setFormData((prev) => ({ ...prev, type: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="serialNumber">Serial Number</Label>
                  <Input
                    id="serialNumber"
                    value={formData.serialNumber}
                    onChange={(e) => setFormData((prev) => ({ ...prev, serialNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="assignedTo">Assigned To</Label>
                  <Select
                    value={formData.assignedTo}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, assignedTo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select employee" />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((employee: any) => (
                        <SelectItem key={employee.id} value={employee.id.toString()}>
                          {employee.firstName} {employee.lastName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value) => setFormData((prev) => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="assigned">Assigned</SelectItem>
                        <SelectItem value="maintenance">Maintenance</SelectItem>
                        <SelectItem value="retired">Retired</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                    <Input
                      id="purchaseDate"
                      type="date"
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData((prev) => ({ ...prev, purchaseDate: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="purchasePrice">Purchase Price</Label>
                  <Input
                    id="purchasePrice"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData((prev) => ({ ...prev, purchasePrice: e.target.value }))}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" type="button" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createEquipmentMutation.isPending}>
                    {createEquipmentMutation.isPending ? "Saving..." : "Add Equipment"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="forms">Signature Forms</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Available</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{availableCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Assigned</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{assignedCount}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Maintenance</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold">{maintenanceCount}</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search equipment..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Equipment Inventory</CardTitle>
              <CardDescription>All company equipment and assets</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-sm font-medium">Item</th>
                      <th className="text-left py-2 text-sm font-medium">Type</th>
                      <th className="text-left py-2 text-sm font-medium">Assigned To</th>
                      <th className="text-left py-2 text-sm font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEquipment.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="py-3">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.serialNumber || "No serial"}
                          </div>
                        </td>
                        <td className="py-3 text-sm">{item.type}</td>
                        <td className="py-3 text-sm">
                          {item.assignedTo ? employeeLookup.get(item.assignedTo) : "Unassigned"}
                        </td>
                        <td className="py-3">
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                    {filteredEquipment.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
                          <div className="flex flex-col items-center gap-3">
                            <Package className="h-8 w-8 opacity-50" />
                            No equipment found.
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="forms" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Signature Forms</CardTitle>
              <CardDescription>
                Generate agreement, checklist, return, or receipt links for employees.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Select equipment below to create a link. The link opens a public form for signatures.
            </CardContent>
          </Card>

          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search equipment..."
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="available">Available</SelectItem>
                <SelectItem value="assigned">Assigned</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Generate Links</CardTitle>
              <CardDescription>Pick an equipment item to create a form link</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 text-sm font-medium">Item</th>
                      <th className="text-left py-2 text-sm font-medium">Type</th>
                      <th className="text-left py-2 text-sm font-medium">Assigned To</th>
                      <th className="text-left py-2 text-sm font-medium">Status</th>
                      <th className="text-left py-2 text-sm font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEquipment.map((item) => (
                      <tr key={`forms-${item.id}`} className="border-b">
                        <td className="py-3">
                          <div className="font-medium">{item.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {item.serialNumber || "No serial"}
                          </div>
                        </td>
                        <td className="py-3 text-sm">{item.type}</td>
                        <td className="py-3 text-sm">
                          {item.assignedTo ? employeeLookup.get(item.assignedTo) : "Unassigned"}
                        </td>
                        <td className="py-3">
                          <Badge className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="py-3">
                          <Button variant="outline" size="sm" onClick={() => openLinkDialog(item.id)}>
                            <Link2 className="mr-2 h-4 w-4" />
                            Signature Link
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {filteredEquipment.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                          <div className="flex flex-col items-center gap-3">
                            <Package className="h-8 w-8 opacity-50" />
                            No equipment found.
                          </div>
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

      <Dialog open={isLinkDialogOpen} onOpenChange={setIsLinkDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Generate Signature Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              {selectedEquipmentId
                ? `Equipment: ${equipment.find((item) => item.id === selectedEquipmentId)?.name || "Item"}`
                : "Select an equipment item."}
            </div>
            <div>
              <Label htmlFor="equipment-signature-type">Form Type</Label>
              <Select
                value={signatureType}
                onValueChange={(value) => setSignatureType(value as SignatureType)}
              >
                <SelectTrigger id="equipment-signature-type">
                  <SelectValue placeholder="Select form type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="agreement">Agreement</SelectItem>
                  <SelectItem value="checklist">Checklist</SelectItem>
                  <SelectItem value="return">Return</SelectItem>
                  <SelectItem value="receipt">Receipt</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={() => createSignatureLinkMutation.mutate()}
              disabled={createSignatureLinkMutation.isPending}
            >
              {createSignatureLinkMutation.isPending ? "Generating..." : "Generate Link"}
            </Button>
            {generatedLink && (
              <div className="rounded border border-dashed p-3 text-sm">
                <div className="text-xs text-muted-foreground">Signature link</div>
                <div className="break-all font-medium">{generatedLink}</div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

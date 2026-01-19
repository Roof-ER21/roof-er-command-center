import { useState, useMemo, type FormEvent } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Minus, Package } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/useToast";

type Category = "apparel" | "office_supplies" | "insurance_team" | "retail_team" | "daily_use" | "other";

interface InventoryItem {
  id: number;
  name: string;
  category: Category;
  color?: string;
  size?: string;
  quantity: number;
  location?: string;
  notes?: string;
  reorderThreshold: number;
  lastUpdated: string;
  createdAt: string;
}

interface InventoryStats {
  apparel: number;
  office_supplies: number;
  insurance_team: number;
  retail_team: number;
  daily_use: number;
  other: number;
  lowStock: number;
  total: number;
}

const CATEGORIES: { value: Category; label: string }[] = [
  { value: "apparel", label: "Apparel" },
  { value: "office_supplies", label: "Office Supplies" },
  { value: "insurance_team", label: "Insurance Team" },
  { value: "retail_team", label: "Retail Team" },
  { value: "daily_use", label: "Daily Use" },
  { value: "other", label: "Other" },
];

export function InventoryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "other" as Category,
    color: "",
    size: "",
    quantity: "0",
    location: "",
    notes: "",
    reorderThreshold: "10",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch inventory items
  const { data: inventory = [], isLoading } = useQuery<InventoryItem[]>({
    queryKey: ["/api/hr/inventory", activeCategory],
    queryFn: async () => {
      const url = activeCategory === "all"
        ? "/api/hr/inventory"
        : `/api/hr/inventory?category=${activeCategory}`;
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch inventory");
      return response.json();
    },
  });

  // Fetch stats
  const { data: stats } = useQuery<InventoryStats>({
    queryKey: ["/api/hr/inventory/stats"],
    queryFn: async () => {
      const response = await fetch("/api/hr/inventory/stats", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
  });

  // Create inventory item
  const createInventoryMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/hr/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...data,
          quantity: parseInt(data.quantity),
          reorderThreshold: parseInt(data.reorderThreshold),
        }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to create inventory item");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/inventory/stats"] });
      setIsAddDialogOpen(false);
      resetForm();
      toast({
        title: "Item added",
        description: "New inventory item has been added.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to add item",
        variant: "destructive",
      });
    },
  });

  // Update inventory item
  const updateInventoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<InventoryItem> }) => {
      const response = await fetch(`/api/hr/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to update inventory item");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/inventory/stats"] });
      setIsEditDialogOpen(false);
      setSelectedItem(null);
      toast({
        title: "Item updated",
        description: "Inventory item has been updated.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to update item",
        variant: "destructive",
      });
    },
  });

  // Adjust quantity mutation
  const adjustQuantityMutation = useMutation({
    mutationFn: async ({ id, adjustment }: { id: number; adjustment: number }) => {
      const item = inventory.find(i => i.id === id);
      if (!item) throw new Error("Item not found");
      const newQuantity = Math.max(0, item.quantity + adjustment);

      const response = await fetch(`/api/hr/inventory/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ quantity: newQuantity }),
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || "Failed to adjust quantity");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/hr/inventory"] });
      queryClient.invalidateQueries({ queryKey: ["/api/hr/inventory/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error?.message || "Failed to adjust quantity",
        variant: "destructive",
      });
    },
  });

  // Filter inventory
  const filteredInventory = useMemo(() => {
    return inventory.filter((item) => {
      if (!searchTerm) return true;
      const searchValue = `${item.name} ${item.category} ${item.color || ""} ${item.size || ""} ${item.location || ""}`.toLowerCase();
      return searchValue.includes(searchTerm.toLowerCase());
    });
  }, [inventory, searchTerm]);

  const resetForm = () => {
    setFormData({
      name: "",
      category: "other",
      color: "",
      size: "",
      quantity: "0",
      location: "",
      notes: "",
      reorderThreshold: "10",
    });
  };

  const handleSubmitAdd = (e: FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast({
        title: "Missing fields",
        description: "Name is required.",
        variant: "destructive",
      });
      return;
    }
    createInventoryMutation.mutate(formData);
  };

  const handleSubmitEdit = (e: FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    updateInventoryMutation.mutate({
      id: selectedItem.id,
      data: {
        quantity: parseInt(formData.quantity),
        location: formData.location,
        notes: formData.notes,
        reorderThreshold: parseInt(formData.reorderThreshold),
      },
    });
  };

  const openEditDialog = (item: InventoryItem) => {
    setSelectedItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      color: item.color || "",
      size: item.size || "",
      quantity: item.quantity.toString(),
      location: item.location || "",
      notes: item.notes || "",
      reorderThreshold: item.reorderThreshold.toString(),
    });
    setIsEditDialogOpen(true);
  };

  const isLowStock = (item: InventoryItem) => item.quantity <= item.reorderThreshold;

  const getCategoryLabel = (category: Category) => {
    return CATEGORIES.find(c => c.value === category)?.label || category;
  };

  if (isLoading) {
    return <div className="p-8">Loading inventory...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inventory Management</h1>
          <p className="text-muted-foreground">
            Track and manage bulk inventory across all categories
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Item
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>Add Inventory Item</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmitAdd} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="T-shirt, Pens, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value as Category }))}
                  >
                    <SelectTrigger id="category">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={formData.color}
                    onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
                    placeholder="Blue, Red, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="size">Size</Label>
                  <Input
                    id="size"
                    value={formData.size}
                    onChange={(e) => setFormData((prev) => ({ ...prev, size: e.target.value }))}
                    placeholder="S, M, L, XL, etc."
                  />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    type="number"
                    min="0"
                    value={formData.quantity}
                    onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="reorderThreshold">Reorder Threshold</Label>
                  <Input
                    id="reorderThreshold"
                    type="number"
                    min="0"
                    value={formData.reorderThreshold}
                    onChange={(e) => setFormData((prev) => ({ ...prev, reorderThreshold: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                  placeholder="Warehouse A, Office, etc."
                />
              </div>
              <div>
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes..."
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" type="button" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createInventoryMutation.isPending}>
                  {createInventoryMutation.isPending ? "Saving..." : "Add Item"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Apparel</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.apparel || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Office Supplies</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.office_supplies || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Insurance Team</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.insurance_team || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Retail Team</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.retail_team || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Daily Use</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{stats?.daily_use || 0}</p>
          </CardContent>
        </Card>
        <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
          <CardHeader className="pb-2">
            <CardDescription className="text-orange-900 dark:text-orange-100">Low Stock</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{stats?.lowStock || 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeCategory} onValueChange={(value) => setActiveCategory(value as Category | "all")}>
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          {CATEGORIES.map((cat) => (
            <TabsTrigger key={cat.value} value={cat.value}>
              {cat.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value={activeCategory} className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, color, size, location..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          {/* Table */}
          <Card>
            <CardHeader>
              <CardTitle>
                {activeCategory === "all" ? "All Inventory" : getCategoryLabel(activeCategory as Category)}
              </CardTitle>
              <CardDescription>
                {filteredInventory.length} item(s) found
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Size</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredInventory.map((item) => (
                    <TableRow
                      key={item.id}
                      className={isLowStock(item) ? "bg-orange-50 dark:bg-orange-950/20" : ""}
                    >
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {item.name}
                          {isLowStock(item) && (
                            <Badge variant="destructive" className="text-xs">
                              Low Stock
                            </Badge>
                          )}
                        </div>
                        {item.notes && (
                          <div className="text-xs text-muted-foreground mt-1">{item.notes}</div>
                        )}
                      </TableCell>
                      <TableCell>{getCategoryLabel(item.category)}</TableCell>
                      <TableCell>{item.color || "-"}</TableCell>
                      <TableCell>{item.size || "-"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => adjustQuantityMutation.mutate({ id: item.id, adjustment: -1 })}
                            disabled={adjustQuantityMutation.isPending}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="font-bold min-w-[30px] text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => adjustQuantityMutation.mutate({ id: item.id, adjustment: 1 })}
                            disabled={adjustQuantityMutation.isPending}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>{item.location || "-"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(item.lastUpdated).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredInventory.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8">
                        <div className="flex flex-col items-center gap-3 text-muted-foreground">
                          <Package className="h-8 w-8 opacity-50" />
                          No inventory items found.
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitEdit} className="space-y-4">
            <div>
              <Label>Name</Label>
              <div className="text-sm font-medium py-2">{selectedItem?.name}</div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="edit-quantity">Quantity</Label>
                <Input
                  id="edit-quantity"
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => setFormData((prev) => ({ ...prev, quantity: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-reorderThreshold">Reorder Threshold</Label>
                <Input
                  id="edit-reorderThreshold"
                  type="number"
                  min="0"
                  value={formData.reorderThreshold}
                  onChange={(e) => setFormData((prev) => ({ ...prev, reorderThreshold: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="Warehouse A, Office, etc."
              />
            </div>
            <div>
              <Label htmlFor="edit-notes">Notes</Label>
              <Input
                id="edit-notes"
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes..."
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={updateInventoryMutation.isPending}>
                {updateInventoryMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

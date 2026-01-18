import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  UserPlus,
  CheckCircle,
  Clock,
  FileText,
  GraduationCap,
  Package,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { OnboardingTemplatesPage } from "@/modules/hr/pages/OnboardingTemplatesPage";

interface OnboardingChecklist {
  id: number;
  employeeId: number;
  employeeName: string;
  startDate: string;
  completionPercentage: number;
  status: 'pending' | 'in_progress' | 'completed';
  tasks: OnboardingTask[];
}

interface OnboardingTask {
  id: number;
  name: string;
  category: 'documents' | 'training' | 'equipment' | 'admin';
  isCompleted: boolean;
  completedAt?: string;
  dueDate?: string;
}

export function OnboardingPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin, isManager } = usePermissions();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  const tabFromQuery = searchParams.get("tab");
  const tabFromPath = location.pathname.includes("onboarding-templates") ? "templates" : "checklists";
  const resolvedTab = tabFromQuery || tabFromPath;
  const [activeTab, setActiveTab] = useState(resolvedTab);

  useEffect(() => {
    setActiveTab(resolvedTab);
  }, [resolvedTab]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const onBasePath = location.pathname === "/hr/onboarding";
    if (value === "checklists" && onBasePath) {
      setSearchParams({}, { replace: true });
      return;
    }
    setSearchParams({ tab: value }, { replace: true });
  };

  const { data: employees } = useQuery({
    queryKey: ['/api/hr/employees'],
    queryFn: async () => {
      const response = await fetch('/api/hr/employees', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    }
  });

  const { data: checklists, isLoading } = useQuery({
    queryKey: ['/api/hr/onboarding'],
    queryFn: async () => {
      const response = await fetch('/api/hr/onboarding', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch onboarding checklists');
      return response.json();
    }
  });

  const createChecklistMutation = useMutation({
    mutationFn: async (employeeId: number) => {
      const response = await fetch('/api/hr/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ employeeId })
      });
      if (!response.ok) throw new Error('Failed to create checklist');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/onboarding'] });
      setIsDialogOpen(false);
      toast({
        title: 'Success',
        description: 'Onboarding checklist created successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create onboarding checklist',
        variant: 'destructive'
      });
    }
  });

  const toggleTaskMutation = useMutation({
    mutationFn: async ({ checklistId, taskId }: { checklistId: number; taskId: number }) => {
      const response = await fetch(`/api/hr/onboarding/${checklistId}/tasks/${taskId}/toggle`, {
        method: 'PATCH',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to toggle task');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/onboarding'] });
      toast({
        title: 'Success',
        description: 'Task updated successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update task',
        variant: 'destructive'
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'documents': return <FileText className="w-4 h-4" />;
      case 'training': return <GraduationCap className="w-4 h-4" />;
      case 'equipment': return <Package className="w-4 h-4" />;
      case 'admin': return <CheckCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const handleCreateChecklist = () => {
    if (selectedEmployee) {
      createChecklistMutation.mutate(selectedEmployee);
    }
  };

  const handleToggleTask = (checklistId: number, taskId: number) => {
    toggleTaskMutation.mutate({ checklistId, taskId });
  };

  // Get employees without onboarding checklists
  const employeesWithoutChecklist = employees?.filter(
    (emp: any) => !checklists?.some((cl: OnboardingChecklist) => cl.employeeId === emp.id)
  ) || [];

  if (isLoading) {
    return <div className="p-8">Loading onboarding checklists...</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Onboarding</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage new hire onboarding checklists and track progress
          </p>
        </div>
        {activeTab === "checklists" && (isAdmin() || isManager()) && (
          <div className="mt-4 sm:mt-0">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create Checklist
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Onboarding Checklist</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="employee">Select Employee</Label>
                    <Select value={selectedEmployee?.toString()} onValueChange={(value) => setSelectedEmployee(parseInt(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select employee" />
                      </SelectTrigger>
                      <SelectContent>
                        {employeesWithoutChecklist.map((emp: any) => (
                          <SelectItem key={emp.id} value={emp.id.toString()}>
                            {emp.firstName} {emp.lastName} - {emp.position}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleCreateChecklist}
                      disabled={!selectedEmployee || createChecklistMutation.isPending}
                    >
                      {createChecklistMutation.isPending ? 'Creating...' : 'Create Checklist'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList>
          <TabsTrigger value="checklists">Checklists</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="checklists">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 mb-8">
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Clock className="w-6 h-6 text-yellow-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">
                        In Progress
                      </dt>
                      <dd className="text-2xl font-semibold text-foreground">
                        {checklists?.filter((cl: OnboardingChecklist) => cl.status === 'in_progress').length || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">
                        Completed
                      </dt>
                      <dd className="text-2xl font-semibold text-foreground">
                        {checklists?.filter((cl: OnboardingChecklist) => cl.status === 'completed').length || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <AlertCircle className="w-6 h-6 text-blue-500" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-muted-foreground truncate">
                        Total Active
                      </dt>
                      <dd className="text-2xl font-semibold text-foreground">
                        {checklists?.length || 0}
                      </dd>
                    </dl>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6">
            {checklists?.map((checklist: OnboardingChecklist) => (
              <Card key={checklist.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>{checklist.employeeName}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        Start Date: {new Date(checklist.startDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={getStatusColor(checklist.status)}>
                        {checklist.status.replace('_', ' ')}
                      </Badge>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-foreground">
                          {checklist.completionPercentage}%
                        </p>
                        <p className="text-xs text-muted-foreground">Complete</p>
                      </div>
                    </div>
                  </div>
                  <Progress value={checklist.completionPercentage} className="mt-4" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {['documents', 'training', 'equipment', 'admin'].map((category) => {
                      const categoryTasks = checklist.tasks?.filter((task: OnboardingTask) => task.category === category) || [];
                      if (categoryTasks.length === 0) return null;

                      return (
                        <div key={category} className="space-y-2">
                          <h4 className="text-sm font-semibold text-foreground capitalize flex items-center gap-2">
                            {getCategoryIcon(category)}
                            {category}
                            {category === "training" && (
                              <Button asChild variant="link" size="sm" className="h-auto px-0 text-xs">
                                <Link to="/training">Open Training</Link>
                              </Button>
                            )}
                          </h4>
                          <div className="space-y-2 pl-6">
                            {categoryTasks.map((task: OnboardingTask) => (
                              <div key={task.id} className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50">
                                <Checkbox
                                  checked={task.isCompleted}
                                  onCheckedChange={() => handleToggleTask(checklist.id, task.id)}
                                  disabled={!isAdmin() && !isManager()}
                                />
                                <div className="flex-1">
                                  <p className={`text-sm ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                                    {task.name}
                                  </p>
                                  {task.completedAt && (
                                    <p className="text-xs text-muted-foreground">
                                      Completed: {new Date(task.completedAt).toLocaleDateString()}
                                    </p>
                                  )}
                                  {task.dueDate && !task.isCompleted && (
                                    <p className="text-xs text-yellow-600 dark:text-yellow-400">
                                      Due: {new Date(task.dueDate).toLocaleDateString()}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            ))}

            {(!checklists || checklists.length === 0) && (
              <Card>
                <CardContent className="p-12 text-center">
                  <UserPlus className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No onboarding checklists yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create a checklist for new hires to track their onboarding progress
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <OnboardingTemplatesPage embedded />
        </TabsContent>
      </Tabs>
    </div>
  );
}

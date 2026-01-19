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
  AlertCircle,
  Shield,
  DollarSign,
  Scale,
  Briefcase,
  AlertTriangle,
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

interface OnboardingRequirement {
  id: number;
  requirementName: string;
  description?: string;
  category: 'tax' | 'insurance' | 'legal' | 'training' | 'equipment';
  employeeType: 'W2' | '1099' | 'BOTH';
  status: 'pending' | 'submitted' | 'approved' | 'rejected';
  dueDate?: string;
  submittedAt?: string;
  documentUrl?: string;
  notes?: string;
  isRequired: boolean;
  isOverdue?: boolean;
}

interface EmployeeRequirementsData {
  employee: {
    id: number;
    name: string;
    employmentType: 'W2' | '1099' | 'CONTRACTOR' | 'SUB_CONTRACTOR';
    hireDate?: string;
  };
  requirements: OnboardingRequirement[];
  groupedByCategory: Record<string, OnboardingRequirement[]>;
  completionPercentage: number;
  totalRequirements: number;
  completedRequirements: number;
}

export function OnboardingPage() {
  const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
  const [selectedEmployeeForRequirements, setSelectedEmployeeForRequirements] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState<'ALL' | 'W2' | '1099'>('ALL');
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

  // New query for requirements
  const { data: requirementsData } = useQuery<EmployeeRequirementsData | null>({
    queryKey: ['/api/hr/onboarding/requirements', selectedEmployeeForRequirements],
    queryFn: async () => {
      if (!selectedEmployeeForRequirements) return null;
      const response = await fetch(`/api/hr/onboarding/${selectedEmployeeForRequirements}/requirements`, {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch requirements');
      return response.json();
    },
    enabled: !!selectedEmployeeForRequirements,
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

  const updateRequirementMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: number; status: string; notes?: string }) => {
      const response = await fetch(`/api/hr/onboarding/requirements/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status, notes })
      });
      if (!response.ok) throw new Error('Failed to update requirement');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/onboarding/requirements'] });
      toast({
        title: 'Success',
        description: 'Requirement updated successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update requirement',
        variant: 'destructive'
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'in_progress': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'tax': return <DollarSign className="w-4 h-4" />;
      case 'insurance': return <Shield className="w-4 h-4" />;
      case 'legal': return <Scale className="w-4 h-4" />;
      case 'training': return <GraduationCap className="w-4 h-4" />;
      case 'equipment': return <Package className="w-4 h-4" />;
      case 'documents': return <FileText className="w-4 h-4" />;
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

  const handleUpdateRequirement = (id: number, status: string) => {
    updateRequirementMutation.mutate({ id, status });
  };

  // Get employees without onboarding checklists
  const employeesWithoutChecklist = employees?.filter(
    (emp: any) => !checklists?.some((cl: OnboardingChecklist) => cl.employeeId === emp.id)
  ) || [];

  // Get employees with W2 or 1099 employment type
  const employeesWithRequirements = employees?.filter(
    (emp: any) => emp.employmentType === 'W2' || emp.employmentType === '1099'
  ) || [];

  // Filter requirements based on employment type filter
  const filteredRequirements = requirementsData?.requirements.filter((req) => {
    if (employmentTypeFilter === 'ALL') return true;
    return req.employeeType === employmentTypeFilter || req.employeeType === 'BOTH';
  }) || [];

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
          <TabsTrigger value="checklists">Legacy Checklists</TabsTrigger>
          <TabsTrigger value="requirements">W2 vs 1099 Requirements</TabsTrigger>
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

        <TabsContent value="requirements">
          <div className="space-y-6">
            {/* Employee Selector */}
            <Card>
              <CardHeader>
                <CardTitle>Select Employee</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={selectedEmployeeForRequirements?.toString() || ''}
                  onValueChange={(value) => setSelectedEmployeeForRequirements(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select employee to view requirements" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeesWithRequirements.map((emp: any) => (
                      <SelectItem key={emp.id} value={emp.id.toString()}>
                        {emp.firstName} {emp.lastName} - {emp.employmentType} - {emp.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Requirements Display */}
            {requirementsData && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
                  <Card>
                    <CardContent className="p-5">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <Briefcase className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-muted-foreground truncate">
                              Employment Type
                            </dt>
                            <dd className="text-xl font-semibold text-foreground">
                              {requirementsData.employee.employmentType}
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
                              Completion
                            </dt>
                            <dd className="text-xl font-semibold text-foreground">
                              {requirementsData.completionPercentage}%
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
                          <FileText className="w-6 h-6 text-blue-500" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-muted-foreground truncate">
                              Total Requirements
                            </dt>
                            <dd className="text-xl font-semibold text-foreground">
                              {requirementsData.totalRequirements}
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
                          <AlertTriangle className="w-6 h-6 text-red-500" />
                        </div>
                        <div className="ml-5 w-0 flex-1">
                          <dl>
                            <dt className="text-sm font-medium text-muted-foreground truncate">
                              Overdue
                            </dt>
                            <dd className="text-xl font-semibold text-foreground">
                              {requirementsData.requirements.filter((r) => r.isOverdue).length}
                            </dd>
                          </dl>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress Bar */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{requirementsData.employee.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {requirementsData.employee.employmentType}
                        </Badge>
                        <Select value={employmentTypeFilter} onValueChange={(value: any) => setEmploymentTypeFilter(value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ALL">All</SelectItem>
                            <SelectItem value="W2">W2 Only</SelectItem>
                            <SelectItem value="1099">1099 Only</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Progress value={requirementsData.completionPercentage} className="mt-4" />
                    <p className="text-sm text-muted-foreground mt-2">
                      {requirementsData.completedRequirements} of {requirementsData.totalRequirements} requirements completed
                    </p>
                  </CardHeader>
                </Card>

                {/* Requirements by Category */}
                <div className="space-y-4">
                  {['tax', 'insurance', 'legal', 'training', 'equipment'].map((category) => {
                    const categoryReqs = filteredRequirements.filter((req) => req.category === category);
                    if (categoryReqs.length === 0) return null;

                    const categoryName = category.charAt(0).toUpperCase() + category.slice(1);

                    return (
                      <Card key={category}>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            {getCategoryIcon(category)}
                            {categoryName} Requirements
                            <Badge variant="secondary">{categoryReqs.length}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {categoryReqs.map((req) => (
                              <div
                                key={req.id}
                                className={`p-4 rounded-lg border ${
                                  req.isOverdue
                                    ? 'border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800'
                                    : 'border-border'
                                }`}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <h4 className="font-semibold text-foreground">
                                        {req.requirementName}
                                      </h4>
                                      {req.isRequired && (
                                        <Badge variant="destructive" className="text-xs">
                                          Required
                                        </Badge>
                                      )}
                                      {req.isOverdue && (
                                        <Badge variant="destructive" className="text-xs">
                                          Overdue
                                        </Badge>
                                      )}
                                      <Badge variant="outline" className="text-xs">
                                        {req.employeeType}
                                      </Badge>
                                    </div>
                                    {req.description && (
                                      <p className="text-sm text-muted-foreground mt-1">
                                        {req.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                                      {req.dueDate && (
                                        <span className={req.isOverdue ? 'text-red-600 font-semibold' : ''}>
                                          Due: {new Date(req.dueDate).toLocaleDateString()}
                                        </span>
                                      )}
                                      {req.submittedAt && (
                                        <span>
                                          Submitted: {new Date(req.submittedAt).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                    {req.notes && (
                                      <p className="text-xs text-muted-foreground mt-2 italic">
                                        Note: {req.notes}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge className={getStatusColor(req.status)}>
                                      {req.status}
                                    </Badge>
                                    {(isAdmin() || isManager()) && req.status === 'submitted' && (
                                      <div className="flex gap-1">
                                        <Button
                                          size="sm"
                                          variant="default"
                                          onClick={() => handleUpdateRequirement(req.id, 'approved')}
                                        >
                                          Approve
                                        </Button>
                                        <Button
                                          size="sm"
                                          variant="destructive"
                                          onClick={() => handleUpdateRequirement(req.id, 'rejected')}
                                        >
                                          Reject
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            )}

            {!selectedEmployeeForRequirements && (
              <Card>
                <CardContent className="p-12 text-center">
                  <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Select an employee to view their onboarding requirements</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Requirements are automatically created based on employment type (W2 or 1099)
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

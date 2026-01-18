import { useState } from 'react';
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { UserPlus, Search, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { usePermissions } from '@/hooks/usePermissions';

export function EmployeesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { isAdmin } = usePermissions();

  // Form state
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    firstName: '',
    lastName: '',
    role: 'EMPLOYEE',
    department: '',
    position: '',
    employmentType: '',
    hireDate: '',
    phone: '',
    isActive: true,
    hasHRAccess: true,
    hasTrainingAccess: true,
    hasFieldAccess: false,
    hasLeaderboardAccess: false,
  });

  const { data: employees, isLoading } = useQuery({
    queryKey: ['/api/hr/employees', 'includeInactive'],
    queryFn: async () => {
      const response = await fetch('/api/hr/employees?includeInactive=true', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    }
  });

  const createEmployeeMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch('/api/hr/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to create employee');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/employees'] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Employee created successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to create employee',
        variant: 'destructive'
      });
    }
  });

  const updateEmployeeMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof formData> }) => {
      const response = await fetch(`/api/hr/employees/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data)
      });
      if (!response.ok) throw new Error('Failed to update employee');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/employees'] });
      setIsDialogOpen(false);
      setEditingEmployee(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'Employee updated successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to update employee',
        variant: 'destructive'
      });
    }
  });

  const deleteEmployeeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/hr/employees/${id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to delete employee');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/employees'] });
      toast({
        title: 'Success',
        description: 'Employee deactivated successfully'
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to delete employee',
        variant: 'destructive'
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployee) {
      updateEmployeeMutation.mutate({
        id: editingEmployee.id,
        data: formData
      });
    } else {
      createEmployeeMutation.mutate(formData);
    }
  };

  const handleEdit = (employee: any) => {
    setEditingEmployee(employee);
    setFormData({
      email: employee.email || '',
      username: employee.username || '',
      password: '',
      firstName: employee.firstName || '',
      lastName: employee.lastName || '',
      role: employee.role || 'EMPLOYEE',
      department: employee.department || '',
      position: employee.position || '',
      employmentType: employee.employmentType || '',
      hireDate: employee.hireDate ? new Date(employee.hireDate).toISOString().split('T')[0] : '',
      phone: employee.phone || '',
      isActive: employee.isActive ?? true,
      hasHRAccess: employee.hasHRAccess ?? true,
      hasTrainingAccess: employee.hasTrainingAccess ?? true,
      hasFieldAccess: employee.hasFieldAccess ?? false,
      hasLeaderboardAccess: employee.hasLeaderboardAccess ?? false,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Deactivate this employee? They will lose access but remain in records.')) {
      deleteEmployeeMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      username: '',
      password: '',
      firstName: '',
      lastName: '',
      role: 'EMPLOYEE',
      department: '',
      position: '',
      employmentType: '',
      hireDate: '',
      phone: '',
      isActive: true,
      hasHRAccess: true,
      hasTrainingAccess: true,
      hasFieldAccess: false,
      hasLeaderboardAccess: false,
    });
    setEditingEmployee(null);
  };

  const filteredEmployees = employees?.filter((employee: any) => {
    const searchValue = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || (
      employee.firstName?.toLowerCase().includes(searchValue) ||
      employee.lastName?.toLowerCase().includes(searchValue) ||
      employee.email?.toLowerCase().includes(searchValue) ||
      employee.position?.toLowerCase().includes(searchValue) ||
      employee.department?.toLowerCase().includes(searchValue)
    );

    const normalizedRole = employee.role?.toUpperCase();
    const matchesRole = roleFilter === 'all' || normalizedRole === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' ? employee.isActive : !employee.isActive);
    const matchesDepartment = departmentFilter === 'all' || employee.department === departmentFilter;
    const matchesEmploymentType = employmentTypeFilter === 'all' || employee.employmentType === employmentTypeFilter;

    return matchesSearch && matchesRole && matchesStatus && matchesDepartment && matchesEmploymentType;
  }) || [];

  const getRoleColor = (role: string) => {
    switch (role?.toUpperCase()) {
      case 'SYSTEM_ADMIN':
      case 'HR_ADMIN':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'GENERAL_MANAGER':
      case 'TERRITORY_MANAGER':
      case 'MANAGER':
      case 'TEAM_LEAD':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'CONTRACTOR':
      case 'SUB_CONTRACTOR':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'SALES_REP':
      case 'FIELD_TECH':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200';
      case 'EMPLOYEE':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    }
  };

  const roleOptions = [
    { value: 'SYSTEM_ADMIN', label: 'System Admin' },
    { value: 'HR_ADMIN', label: 'HR Admin' },
    { value: 'GENERAL_MANAGER', label: 'General Manager' },
    { value: 'TERRITORY_MANAGER', label: 'Territory Manager' },
    { value: 'MANAGER', label: 'Manager' },
    { value: 'TEAM_LEAD', label: 'Team Lead' },
    { value: 'EMPLOYEE', label: 'Employee' },
    { value: 'FIELD_TECH', label: 'Field Tech' },
    { value: 'SALES_REP', label: 'Sales Rep' },
    { value: 'CONTRACTOR', label: 'Contractor' },
    { value: 'SOURCER', label: 'Sourcer' },
    { value: 'TRAINEE', label: 'Trainee' },
    { value: 'INSURANCE_MANAGER', label: 'Insurance Manager' },
    { value: 'RETAIL_MANAGER', label: 'Retail Manager' },
  ];

  const departmentOptions = Array.from(
    new Set((employees || []).map((employee: any) => employee.department).filter(Boolean))
  );

  const employmentTypeOptions = ['W2', '1099', 'CONTRACTOR', 'SUB_CONTRACTOR'];

  if (isLoading) {
    return <div className="p-8">Loading employees...</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      <div className="sm:flex sm:items-center sm:justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Employees</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage your team members and their information
          </p>
        </div>
        <div className="mt-4 sm:mt-0 flex gap-2">
          {/* Add Employee - Admin only */}
          {isAdmin() && (
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) {
                resetForm();
              }
            }}>
              <DialogTrigger asChild>
                <Button>
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Employee
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{editingEmployee ? 'Edit Employee' : 'Add New Employee'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="Enter first name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Enter last name"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Enter email address"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="username">Username</Label>
                    <Input
                      id="username"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      placeholder="Enter username"
                      required
                    />
                  </div>

                  {!editingEmployee && (
                    <div>
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        placeholder="Enter password"
                        required
                      />
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select role" />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                        placeholder="Enter department"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="position">Position</Label>
                      <Input
                        id="position"
                        value={formData.position}
                        onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                        placeholder="Enter position"
                      />
                    </div>
                    <div>
                      <Label htmlFor="employmentType">Employment Type</Label>
                      <Select
                        value={formData.employmentType || 'none'}
                        onValueChange={(value) =>
                          setFormData({ ...formData, employmentType: value === 'none' ? '' : value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Not set</SelectItem>
                          {employmentTypeOptions.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="hireDate">Hire Date</Label>
                      <Input
                        id="hireDate"
                        type="date"
                        value={formData.hireDate}
                        onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                      />
                    </div>
                    <div className="flex items-center space-x-2 pt-6">
                      <Checkbox
                        id="isActive"
                        checked={formData.isActive}
                        onCheckedChange={(checked) =>
                          setFormData({ ...formData, isActive: Boolean(checked) })
                        }
                      />
                      <Label htmlFor="isActive">Active employee</Label>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>

                  <div>
                    <Label>Module Access</Label>
                    <div className="mt-2 grid grid-cols-2 gap-3">
                      <label className="flex items-center space-x-2 text-sm">
                        <Checkbox
                          checked={formData.hasHRAccess}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, hasHRAccess: Boolean(checked) })
                          }
                        />
                        <span>HR</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm">
                        <Checkbox
                          checked={formData.hasTrainingAccess}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, hasTrainingAccess: Boolean(checked) })
                          }
                        />
                        <span>Training</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm">
                        <Checkbox
                          checked={formData.hasFieldAccess}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, hasFieldAccess: Boolean(checked) })
                          }
                        />
                        <span>Field</span>
                      </label>
                      <label className="flex items-center space-x-2 text-sm">
                        <Checkbox
                          checked={formData.hasLeaderboardAccess}
                          onCheckedChange={(checked) =>
                            setFormData({ ...formData, hasLeaderboardAccess: Boolean(checked) })
                          }
                        />
                        <span>Leaderboard</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => {
                      setIsDialogOpen(false);
                      resetForm();
                    }}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createEmployeeMutation.isPending || updateEmployeeMutation.isPending}>
                      {createEmployeeMutation.isPending || updateEmployeeMutation.isPending ? 'Saving...' : editingEmployee ? 'Update Employee' : 'Create Employee'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search employees..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All roles</SelectItem>
                  {roleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All departments</SelectItem>
                  {departmentOptions.map((department) => (
                    <SelectItem key={String(department)} value={String(department)}>
                      {String(department)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={employmentTypeFilter} onValueChange={setEmploymentTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Employment type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {employmentTypeOptions.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Employee List */}
      <Card>
        <CardHeader>
          <CardTitle>All Employees ({filteredEmployees.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">Employee</th>
                  <th className="text-left py-3 px-4">Role</th>
                  <th className="text-left py-3 px-4">Status</th>
                  <th className="text-left py-3 px-4">Department</th>
                  <th className="text-left py-3 px-4">Position</th>
                  <th className="text-left py-3 px-4">Employment Type</th>
                  <th className="text-left py-3 px-4">Hire Date</th>
                  <th className="text-left py-3 px-4">Access</th>
                  {isAdmin() && <th className="text-left py-3 px-4">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee: any) => (
                  <tr key={employee.id} className="border-b dark:border-gray-700 hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-secondary rounded-full flex items-center justify-center mr-3">
                          <span className="text-sm font-medium">
                            {employee.firstName?.[0]}{employee.lastName?.[0]}
                          </span>
                        </div>
                        <div>
                          <Link
                            to={`/hr/employees/${employee.id}`}
                            className="font-medium text-foreground hover:underline"
                          >
                            {employee.firstName} {employee.lastName}
                          </Link>
                          <div className="text-sm text-muted-foreground">{employee.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={getRoleColor(employee.role)}>
                        {employee.role?.replace(/_/g, ' ') || 'Employee'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={employee.isActive ? 'default' : 'secondary'}>
                        {employee.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{employee.department || 'N/A'}</td>
                    <td className="py-3 px-4">{employee.position || 'N/A'}</td>
                    <td className="py-3 px-4">{employee.employmentType || 'N/A'}</td>
                    <td className="py-3 px-4">
                      {employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {employee.hasHRAccess && <Badge variant="outline">HR</Badge>}
                        {employee.hasTrainingAccess && <Badge variant="outline">Training</Badge>}
                        {employee.hasFieldAccess && <Badge variant="outline">Field</Badge>}
                        {employee.hasLeaderboardAccess && <Badge variant="outline">Leaderboard</Badge>}
                        {!employee.hasHRAccess && !employee.hasTrainingAccess && !employee.hasFieldAccess && !employee.hasLeaderboardAccess && (
                          <span className="text-xs text-muted-foreground">None</span>
                        )}
                      </div>
                    </td>
                    {/* Actions column - Admin only */}
                    {isAdmin() && (
                      <td className="py-3 px-4">
                        <div className="flex space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(employee)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(employee.id)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

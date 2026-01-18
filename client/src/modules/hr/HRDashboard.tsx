import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Users,
  CalendarClock,
  Briefcase,
  DollarSign,
  TrendingUp,
  Check,
  UserPlus,
  Calendar,
  UserCheck,
  FileText
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { Link } from 'wouter';

export function HRDashboard() {
  const { user } = useAuth();
  const { isManager, isAdmin } = usePermissions();

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/hr/dashboard/metrics'],
    queryFn: async () => {
      const response = await fetch('/api/hr/dashboard/metrics', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch metrics');
      return response.json();
    }
  });

  const { data: ptoRequests, isLoading: ptoLoading } = useQuery({
    queryKey: ['/api/hr/pto'],
    queryFn: async () => {
      const response = await fetch('/api/hr/pto', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch PTO requests');
      return response.json();
    }
  });

  const { data: candidates, isLoading: candidatesLoading } = useQuery({
    queryKey: ['/api/hr/candidates'],
    queryFn: async () => {
      const response = await fetch('/api/hr/candidates', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch candidates');
      return response.json();
    },
    enabled: isManager() // Only fetch for managers and admins
  });

  const { data: employees } = useQuery({
    queryKey: ['/api/hr/employees'],
    queryFn: async () => {
      const response = await fetch('/api/hr/employees', {
        credentials: 'include'
      });
      if (!response.ok) throw new Error('Failed to fetch employees');
      return response.json();
    },
    enabled: isManager() // Only fetch for managers and admins
  });

  const pendingPTO = ptoRequests?.filter((request: any) => request.status === 'pending') || [];
  const activeCandidates = candidates?.filter((candidate: any) =>
    candidate.status !== 'rejected' && candidate.status !== 'hired'
  ) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'denied': return 'bg-red-100 text-red-800';
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'screening': return 'bg-purple-100 text-purple-800';
      case 'interview': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getEmployeeById = (id: number) => {
    return employees?.find((e: any) => e.id === id || e.userId === id);
  };

  if (metricsLoading || ptoLoading || candidatesLoading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8">
      {/* Stats Grid - Role Based */}
      {isManager() ? (
        // Manager/Admin Stats
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-5 mb-8">
          <Card className="animate-fade-in">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      Active Employees
                    </dt>
                    <dd className="text-2xl font-semibold text-foreground">
                      {metrics?.activeEmployees || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarClock className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      Pending PTO
                    </dt>
                    <dd className="text-2xl font-semibold text-foreground">
                      {metrics?.pendingPTO || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Briefcase className="w-6 h-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      Active Candidates
                    </dt>
                    <dd className="text-2xl font-semibold text-foreground">
                      {metrics?.activeCandidates || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      Team Revenue
                    </dt>
                    <dd className="text-2xl font-semibold text-foreground">
                      ${metrics?.teamRevenue?.toLocaleString() || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      Team Signups
                    </dt>
                    <dd className="text-2xl font-semibold text-foreground">
                      {metrics?.teamSignups || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        // Employee Stats
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="animate-fade-in">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <CalendarClock className="w-6 h-6 text-yellow-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      My PTO Requests
                    </dt>
                    <dd className="text-2xl font-semibold text-foreground">
                      {ptoRequests?.filter((r: any) => r.employeeId === user?.id || r.userId === user?.id).length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Check className="w-6 h-6 text-green-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      Approved PTO
                    </dt>
                    <dd className="text-2xl font-semibold text-foreground">
                      {ptoRequests?.filter((r: any) => (r.employeeId === user?.id || r.userId === user?.id) && r.status === 'approved').length || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <Calendar className="w-6 h-6 text-blue-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      Days Used
                    </dt>
                    <dd className="text-2xl font-semibold text-foreground">
                      {ptoRequests?.filter((r: any) => (r.employeeId === user?.id || r.userId === user?.id) && r.status === 'approved')
                        .reduce((sum: number, r: any) => sum + (r.days || 0), 0) || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="animate-fade-in">
            <CardContent className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FileText className="w-6 h-6 text-purple-500" />
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-muted-foreground truncate">
                      My Documents
                    </dt>
                    <dd className="text-2xl font-semibold text-foreground">
                      {metrics?.myDocuments || 0}
                    </dd>
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Recent Activities - Role Based */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activities</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isManager() ? (
                <>
                  {/* Manager view - Team activities */}
                  {pendingPTO.slice(0, 3).map((request: any) => {
                    const employee = getEmployeeById(request.employeeId || request.userId);
                    return (
                      <div key={request.id} className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
                            <Calendar className="w-4 h-4 text-yellow-600" />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            {employee?.firstName || 'Employee'} {employee?.lastName || ''} requested PTO
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    );
                  })}

                  {activeCandidates.slice(0, 2).map((candidate: any) => (
                    <div key={candidate.id} className="flex items-center space-x-3">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <UserPlus className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">
                          New candidate {candidate.firstName} {candidate.lastName} applied
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {candidate.position}
                        </p>
                      </div>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  {/* Employee view - Personal activities */}
                  {ptoRequests?.filter((r: any) => r.employeeId === user?.id || r.userId === user?.id)
                    .slice(0, 5)
                    .map((request: any) => (
                      <div key={request.id} className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            request.status === 'approved' ? 'bg-green-100' :
                            request.status === 'denied' ? 'bg-red-100' :
                            'bg-yellow-100'
                          }`}>
                            <Calendar className={`w-4 h-4 ${
                              request.status === 'approved' ? 'text-green-600' :
                              request.status === 'denied' ? 'text-red-600' :
                              'text-yellow-600'
                            }`} />
                          </div>
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-foreground">
                            PTO Request {request.status}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    ))}

                  {(!ptoRequests || ptoRequests.filter((r: any) => r.employeeId === user?.id || r.userId === user?.id).length === 0) && (
                    <p className="text-sm text-muted-foreground">No recent activities</p>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions - Role Based */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {/* Employee Actions */}
              {!isManager() && (
                <>
                  <Link href="/hr/pto">
                    <Button
                      variant="outline"
                      className="flex flex-col items-center p-4 h-auto w-full"
                    >
                      <Calendar className="w-8 h-8 text-primary mb-2" />
                      <span className="text-sm font-medium">Request PTO</span>
                    </Button>
                  </Link>

                  <Link href="/hr/profile">
                    <Button
                      variant="outline"
                      className="flex flex-col items-center p-4 h-auto w-full"
                    >
                      <UserCheck className="w-8 h-8 text-primary mb-2" />
                      <span className="text-sm font-medium">My Profile</span>
                    </Button>
                  </Link>

                  <Link href="/hr/documents">
                    <Button
                      variant="outline"
                      className="flex flex-col items-center p-4 h-auto w-full"
                    >
                      <FileText className="w-8 h-8 text-primary mb-2" />
                      <span className="text-sm font-medium">My Documents</span>
                    </Button>
                  </Link>

                  <Link href="/hr/reviews">
                    <Button
                      variant="outline"
                      className="flex flex-col items-center p-4 h-auto w-full"
                    >
                      <TrendingUp className="w-8 h-8 text-primary mb-2" />
                      <span className="text-sm font-medium">My Reviews</span>
                    </Button>
                  </Link>
                </>
              )}

              {/* Manager/Admin Actions */}
              {isManager() && (
                <>
                  <Link href="/hr/employees">
                    <Button
                      variant="outline"
                      className="flex flex-col items-center p-4 h-auto w-full"
                    >
                      <UserPlus className="w-8 h-8 text-primary mb-2" />
                      <span className="text-sm font-medium">Manage Team</span>
                    </Button>
                  </Link>

                  <Link href="/hr/pto">
                    <Button
                      variant="outline"
                      className="flex flex-col items-center p-4 h-auto w-full"
                    >
                      <UserCheck className="w-8 h-8 text-primary mb-2" />
                      <span className="text-sm font-medium">Approve PTO</span>
                    </Button>
                  </Link>

                  {/* Team Reviews - Admin only */}
                  {isAdmin() && (
                    <Link href="/hr/reviews">
                      <Button
                        variant="outline"
                        className="flex flex-col items-center p-4 h-auto w-full"
                      >
                        <TrendingUp className="w-8 h-8 text-primary mb-2" />
                        <span className="text-sm font-medium">Team Reviews</span>
                      </Button>
                    </Link>
                  )}

                  <Link href="/hr/recruiting">
                    <Button
                      variant="outline"
                      className="flex flex-col items-center p-4 h-auto w-full"
                    >
                      <Briefcase className="w-8 h-8 text-primary mb-2" />
                      <span className="text-sm font-medium">Recruitment</span>
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Tables - Role Based */}
      <div className="mt-8 grid grid-cols-1 gap-8">
        {/* Employee View - My PTO Requests */}
        {!isManager() && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>My PTO Requests</CardTitle>
              <Link href="/hr/pto">
                <Button variant="link">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              {ptoRequests?.filter((r: any) => r.employeeId === user?.id || r.userId === user?.id).length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Dates</th>
                        <th className="text-left py-2">Days</th>
                        <th className="text-left py-2">Reason</th>
                        <th className="text-left py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ptoRequests
                        ?.filter((r: any) => r.employeeId === user?.id || r.userId === user?.id)
                        .slice(0, 5)
                        .map((request: any) => (
                          <tr key={request.id} className="border-b">
                            <td className="py-2">
                              {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                            </td>
                            <td className="py-2">{request.days || 0}</td>
                            <td className="py-2">{request.reason || 'N/A'}</td>
                            <td className="py-2">
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-muted-foreground">No PTO requests found</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Manager View - Team PTO Requests */}
        {isManager() && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Pending PTO Requests</CardTitle>
                <Link href="/hr/pto">
                  <Button variant="link">View All</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Employee</th>
                        <th className="text-left py-2">Dates</th>
                        <th className="text-left py-2">Days</th>
                        <th className="text-left py-2">Reason</th>
                        <th className="text-left py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingPTO.slice(0, 5).map((request: any) => {
                        const employee = getEmployeeById(request.employeeId || request.userId);
                        return (
                          <tr key={request.id} className="border-b">
                            <td className="py-2">
                              <div className="flex items-center">
                                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center mr-3">
                                  <span className="text-xs font-medium">
                                    {employee?.firstName?.[0]}{employee?.lastName?.[0]}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-medium">{employee?.firstName} {employee?.lastName}</div>
                                  <div className="text-sm text-muted-foreground">{employee?.position}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-2">
                              {new Date(request.startDate).toLocaleDateString()} - {new Date(request.endDate).toLocaleDateString()}
                            </td>
                            <td className="py-2">{request.days || 0}</td>
                            <td className="py-2">{request.reason || 'N/A'}</td>
                            <td className="py-2">
                              <Badge className={getStatusColor(request.status)}>
                                {request.status}
                              </Badge>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Recruiting Pipeline - Only for Managers */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recruiting Pipeline</CardTitle>
                <Link href="/hr/recruiting">
                  <Button variant="link">View All</Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2">Candidate</th>
                        <th className="text-left py-2">Position</th>
                        <th className="text-left py-2">Stage</th>
                        <th className="text-left py-2">Applied</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeCandidates.slice(0, 5).map((candidate: any) => (
                        <tr key={candidate.id} className="border-b">
                          <td className="py-2">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center mr-3">
                                <span className="text-xs font-medium">
                                  {candidate.firstName?.[0]}{candidate.lastName?.[0]}
                                </span>
                              </div>
                              <div>
                                <div className="font-medium">{candidate.firstName} {candidate.lastName}</div>
                                <div className="text-sm text-muted-foreground">{candidate.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-2">{candidate.position}</td>
                          <td className="py-2">
                            <Badge className={getStatusColor(candidate.status)}>
                              {candidate.status}
                            </Badge>
                          </td>
                          <td className="py-2">
                            {new Date(candidate.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

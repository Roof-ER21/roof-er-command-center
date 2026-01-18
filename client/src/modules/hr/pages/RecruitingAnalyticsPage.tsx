import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/useToast';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  LabelList,
} from 'recharts';
import {
  Users,
  TrendingUp,
  TrendingDown,
  Clock,
  UserCheck,
  Target,
  Calendar,
  BarChart as BarChartIcon,
  Archive,
  Download,
  RotateCcw,
  FileText,
  Search,
  Eye,
} from 'lucide-react';
import { CandidateDetailsDialog } from '../components/CandidateDetailsDialog';
import type { Candidate } from '@shared/schema';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

type Period = '7d' | '30d' | '90d' | 'year' | 'all';

export function RecruitingAnalyticsPage({ embedded = false }: { embedded?: boolean }) {
  const [period, setPeriod] = useState<Period>('30d');
  const [selectedAssigneeId, setSelectedAssigneeId] = useState<string>('all');
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [archiveSearch, setArchiveSearch] = useState('');
  const [archiveStatusFilter, setArchiveStatusFilter] = useState<string>('all');
  const [selectedArchivedIds, setSelectedArchivedIds] = useState<number[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch overview data
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ['recruiting-analytics', 'overview', period, selectedAssigneeId],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      if (selectedAssigneeId !== 'all') params.append('assigneeId', selectedAssigneeId);
      const response = await fetch(`/api/hr/recruiting-analytics/overview?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch overview');
      return response.json();
    },
  });

  // Fetch pipeline data
  const { data: pipeline, isLoading: loadingPipeline } = useQuery({
    queryKey: ['recruiting-analytics', 'pipeline', period, selectedAssigneeId],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      if (selectedAssigneeId !== 'all') params.append('assigneeId', selectedAssigneeId);
      const response = await fetch(`/api/hr/recruiting-analytics/pipeline?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch pipeline');
      return response.json();
    },
  });

  // Fetch recruiters data
  const { data: recruiters, isLoading: loadingRecruiters } = useQuery({
    queryKey: ['recruiting-analytics', 'recruiters-table', period, selectedAssigneeId],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      if (selectedAssigneeId !== 'all') params.append('assigneeId', selectedAssigneeId);
      const response = await fetch(`/api/hr/recruiting-analytics/recruiters?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch recruiters');
      return response.json();
    },
  });

  // Fetch time-to-hire data
  const { data: timeToHire, isLoading: loadingTimeToHire } = useQuery({
    queryKey: ['recruiting-analytics', 'time-to-hire', period, selectedAssigneeId],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      if (selectedAssigneeId !== 'all') params.append('assigneeId', selectedAssigneeId);
      const response = await fetch(`/api/hr/recruiting-analytics/time-to-hire?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch time-to-hire');
      return response.json();
    },
  });

  // Fetch interviews data
  const { data: interviews, isLoading: loadingInterviews } = useQuery({
    queryKey: ['recruiting-analytics', 'interviews', period, selectedAssigneeId],
    queryFn: async () => {
      const params = new URLSearchParams({ period });
      if (selectedAssigneeId !== 'all') params.append('assigneeId', selectedAssigneeId);
      const response = await fetch(`/api/hr/recruiting-analytics/interviews?${params}`, {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch interviews');
      return response.json();
    },
  });

  // Fetch all candidates (including archived) for archive management
  const { data: allCandidates = [], isLoading: loadingCandidates } = useQuery<Candidate[]>({
    queryKey: ['/api/hr/candidates', 'includeArchived'],
    queryFn: async () => {
      const response = await fetch('/api/hr/candidates?includeArchived=true', {
        credentials: 'include',
      });
      if (!response.ok) throw new Error('Failed to fetch candidates');
      return response.json();
    },
  });

  // Fetch employees
  const { data: employees = [] } = useQuery<any[]>({
    queryKey: ['/api/hr/employees'],
    queryFn: async () => {
      const response = await fetch('/api/hr/employees', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch users');
      return response.json();
    },
  });

  const employeeLookup = new Map(employees.map((e) => [e.id, `${e.firstName} ${e.lastName}`]));

  // Get archived candidates only
  const archivedCandidates = allCandidates.filter(c => c.isArchived);

  // Filter archived candidates based on search and status filter
  const filteredArchivedCandidates = archivedCandidates.filter(c => {
    const matchesSearch = `${c.firstName} ${c.lastName} ${c.email}`.toLowerCase().includes(archiveSearch.toLowerCase());
    const matchesStatus = archiveStatusFilter === 'all' || c.status === archiveStatusFilter;
    return matchesSearch && matchesStatus;
  });

  // Archive mutation (single)
  const archiveMutation = useMutation({
    mutationFn: async ({ id, archive }: { id: number; archive: boolean }) => {
      const response = await fetch(`/api/hr/candidates/${id}`, { // Using generic update for archive
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ isArchived: archive }),
      });
      if (!response.ok) throw new Error('Failed to update candidate');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/candidates'] });
      toast({ title: 'Success', description: 'Candidate updated successfully' });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update candidate', variant: 'destructive' });
    },
  });

  // Bulk unarchive mutation
  const bulkUnarchiveMutation = useMutation({
    mutationFn: async ({ candidateIds }: { candidateIds: number[] }) => {
      const response = await fetch('/api/hr/candidates/bulk', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ candidateIds, archive: false }),
      });
      if (!response.ok) throw new Error('Failed to bulk update');
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/hr/candidates'] });
      setSelectedArchivedIds([]);
      toast({ title: 'Success', description: `Restored candidates` });
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to restore candidates', variant: 'destructive' });
    },
  });

  // Export handlers
  const handleExportCSV = (type: 'current' | 'archived' | 'all') => {
    window.open(`/api/hr/recruiting-analytics/export/csv?type=${type}`, '_blank');
  };

  const toggleArchivedSelection = (id: number, checked: boolean) => {
    setSelectedArchivedIds(prev =>
      checked ? [...prev, id] : prev.filter(i => i !== id)
    );
  };

  const toggleSelectAllArchived = (checked: boolean) => {
    setSelectedArchivedIds(checked ? filteredArchivedCandidates.map(c => c.id) : []);
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'rejected': return 'destructive';
      case 'hired': return 'default';
      default: return 'secondary';
    }
  };

  // Transform pipeline data for chart
  const pipelineChartData = pipeline?.stages
    ? [
        { stage: 'Applied', count: pipeline.stages.applied.count, fill: COLORS[0] },
        { stage: 'Screening', count: pipeline.stages.screening.count, fill: COLORS[1] },
        { stage: 'Interview', count: pipeline.stages.interview.count, fill: COLORS[2] },
        { stage: 'Offer', count: pipeline.stages.offer.count, fill: COLORS[3] },
        { stage: 'Hired', count: pipeline.stages.hired.count, fill: COLORS[4] },
      ]
    : [];

  const MetricCard = ({
    title,
    value,
    subtitle,
    icon: Icon,
    trend,
    trendValue,
    loading,
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: any;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    loading?: boolean;
  }) => (
    <Card>
      <CardContent className="pt-6">
        {loading ? (
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-muted-foreground">{title}</p>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <p className="text-3xl font-bold">{value}</p>
              {trend && trendValue && (
                <Badge variant={trend === 'up' ? 'default' : trend === 'down' ? 'destructive' : 'secondary'} className="text-xs">
                  {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {trendValue}
                </Badge>
              )}
            </div>
            {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          </>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {!embedded && (
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Recruitment Analytics</h1>
            <p className="text-muted-foreground">Track your hiring pipeline and recruitment performance</p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-end gap-3">
        <Select value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
            <SelectItem value="year">Last year</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Summary Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Candidates"
          value={overview?.totalCandidates || 0}
          subtitle="In selected period"
          icon={Users}
          loading={loadingOverview}
        />
        <MetricCard
          title="Active Pipeline"
          value={overview?.activePipeline || 0}
          subtitle="Currently in process"
          icon={Target}
          loading={loadingOverview}
        />
        <MetricCard
          title="Hired This Month"
          value={overview?.hiredThisMonth || 0}
          subtitle={`vs ${overview?.hiredLastMonth || 0} last month`}
          icon={UserCheck}
          trend={overview?.hiredThisMonth > overview?.hiredLastMonth ? 'up' : 'down'}
          loading={loadingOverview}
        />
        <MetricCard
          title="Avg Days to Hire"
          value={overview?.avgDaysToHire || 0}
          subtitle="days average"
          icon={Clock}
          loading={loadingOverview}
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Pipeline Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChartIcon className="h-5 w-5" />
              Pipeline Funnel
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPipeline ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={pipelineChartData} layout="vertical" margin={{ left: 20, right: 50 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" />
                  <YAxis dataKey="stage" type="category" width={80} />
                  <Tooltip
                    formatter={(value: number) => [value, 'Candidates']}
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                    {pipelineChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                    <LabelList dataKey="count" position="right" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Time to Hire Trend */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time to Hire Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTimeToHire ? (
              <div className="h-[300px] flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : timeToHire?.trend?.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={timeToHire.trend} margin={{ left: 10, right: 30 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis label={{ value: 'Days', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="avgDays" name="Avg Days" stroke="#3b82f6" strokeWidth={2} />
                  <Line type="monotone" dataKey="hireCount" name="Hires" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No trend data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Team Performance Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRecruiters ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : recruiters?.recruiters?.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Team Member</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Candidates</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Hired</th>
                    <th className="text-center py-3 px-4 font-medium text-muted-foreground">Hire Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {recruiters.recruiters.map((recruiter: any) => (
                    <tr key={recruiter.id} className="border-b">
                      <td className="py-3 px-4 font-medium">{recruiter.name}</td>
                      <td className="text-center py-3 px-4">{recruiter.candidatesAssigned}</td>
                      <td className="text-center py-3 px-4">
                        <span className="font-semibold text-green-600">{recruiter.hiredCount}</span>
                      </td>
                      <td className="text-center py-3 px-4">
                        <Badge variant={recruiter.hireRate >= 15 ? 'default' : 'secondary'}>
                          {recruiter.hireRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              No team data available for this period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Archive Management Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="flex items-center gap-2">
            <Archive className="h-5 w-5" />
            Archive Management
          </CardTitle>
          <div className="flex gap-2">
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleExportCSV('current')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Current Candidates (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportCSV('archived')}>
                  <FileText className="mr-2 h-4 w-4" />
                  Archived Candidates (CSV)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExportCSV('all')}>
                  <FileText className="mr-2 h-4 w-4" />
                  All Candidates (CSV)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="flex flex-wrap gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search archived candidates..."
                  value={archiveSearch}
                  onChange={(e) => setArchiveSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={archiveStatusFilter} onValueChange={setArchiveStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                </SelectContent>
              </Select>

              {selectedArchivedIds.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bulkUnarchiveMutation.mutate({ candidateIds: selectedArchivedIds })}
                  disabled={bulkUnarchiveMutation.isPending}
                >
                  <RotateCcw className="mr-2 h-4 w-4" />
                  Unarchive ({selectedArchivedIds.length})
                </Button>
              )}
            </div>

            {/* Archived Candidates Table */}
            {loadingCandidates ? (
              <div className="space-y-3">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            ) : filteredArchivedCandidates.length > 0 ? (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedArchivedIds.length === filteredArchivedCandidates.length && filteredArchivedCandidates.length > 0}
                          onCheckedChange={(checked) => toggleSelectAllArchived(checked === true)}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Position</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Archived Date</TableHead>
                      <TableHead className="w-20">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredArchivedCandidates.map((candidate) => (
                      <TableRow key={candidate.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedArchivedIds.includes(candidate.id)}
                            onCheckedChange={(checked) => toggleArchivedSelection(candidate.id, checked === true)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{candidate.firstName} {candidate.lastName}</p>
                            <p className="text-xs text-muted-foreground">{candidate.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{candidate.position}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(candidate.status)}>
                            {candidate.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{candidate.archivedAt ? new Date(candidate.archivedAt).toLocaleDateString() : '-'}</TableCell>
                        <TableCell className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedCandidate(candidate);
                            }}
                            title="View Profile"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => archiveMutation.mutate({ id: candidate.id, archive: false })}
                            disabled={archiveMutation.isPending}
                            title="Unarchive"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="py-12 text-center text-muted-foreground">
                <Archive className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-lg font-medium">No archived candidates</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <CandidateDetailsDialog
        candidate={selectedCandidate}
        open={!!selectedCandidate}
        onOpenChange={(open) => !open && setSelectedCandidate(null)}
        employeeLookup={employeeLookup}
      />
    </div>
  );
}
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  Legend
} from "recharts";
import { Users, Calendar, Clock, AlertCircle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export function PtoAnalyticsPage({ embedded = false }: { embedded?: boolean }) {
  const { data: overview, isLoading: loadingOverview } = useQuery<any>({
    queryKey: ["/api/hr/pto/analytics/overview"],
    queryFn: async () => {
      const res = await fetch("/api/hr/pto/analytics/overview", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch overview");
      return res.json();
    }
  });

  const { data: usage, isLoading: loadingUsage } = useQuery<any[]>({
    queryKey: ["/api/hr/pto/analytics/usage"],
    queryFn: async () => {
      const res = await fetch("/api/hr/pto/analytics/usage", { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch usage");
      return res.json();
    }
  });

  const typeChartData = overview?.byType ? Object.entries(overview.byType).map(([name, value], idx) => ({
    name,
    value,
    fill: COLORS[idx % COLORS.length]
  })) : [];

  if (loadingOverview || loadingUsage) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-32" />)}
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-[400px]" />
          <Skeleton className="h-[400px]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!embedded && (
        <div>
          <h1 className="text-3xl font-bold tracking-tight">PTO Analytics</h1>
          <p className="text-muted-foreground">Team usage and balance overview</p>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Days Used</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{overview?.totalUsedDays || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Requests</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-amber-600">{overview?.pendingCount || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Avg Days per User</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {usage?.length ? (overview?.totalUsedDays / usage.length).toFixed(1) : 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Active Employees</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{usage?.length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Usage by Employee</CardTitle>
            <CardDescription>Top PTO users this year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={usage?.slice(0, 10)}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                  />
                  <Bar dataKey="days" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Distribution by Type</CardTitle>
            <CardDescription>Vacation vs Sick vs Personal</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={typeChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {typeChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

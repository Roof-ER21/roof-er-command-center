import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  TrendingUp,
  DollarSign,
  Target,
  Award,
  Plus,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface SalesStats {
  month: {
    revenue: number;
    target: number;
    dealsWon: number;
    dealsPending: number;
    dealsLost: number;
    commission: number;
  };
  ytd: {
    revenue: number;
    dealsWon: number;
    commission: number;
  };
  rank: number | null;
  totalParticipants: number;
}

export function SalesPerformancePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<SalesStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [logDealOpen, setLogDealOpen] = useState(false);
  const [dealForm, setDealForm] = useState({
    status: 'won',
    revenue: '',
    notes: '',
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/sales/my-stats', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch sales stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogDeal = async () => {
    try {
      const response = await fetch('/api/sales/log-deal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          status: dealForm.status,
          revenue: dealForm.revenue ? parseFloat(dealForm.revenue) : undefined,
          notes: dealForm.notes,
        }),
      });

      if (response.ok) {
        toast({
          title: "Deal Logged",
          description: `Deal ${dealForm.status} has been recorded.`,
        });
        setLogDealOpen(false);
        setDealForm({ status: 'won', revenue: '', notes: '' });
        fetchStats();
      } else {
        throw new Error('Failed to log deal');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log deal. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No sales data available yet.</p>
            <Dialog open={logDealOpen} onOpenChange={setLogDealOpen}>
              <DialogTrigger asChild>
                <Button className="mt-4">
                  <Plus className="mr-2 h-4 w-4" />
                  Log Your First Deal
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log Deal</DialogTitle>
                  <DialogDescription>
                    Record a new deal to start tracking your sales performance.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Deal Status</Label>
                    <Select
                      value={dealForm.status}
                      onValueChange={(value) => setDealForm({ ...dealForm, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="won">Won</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="lost">Lost</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {dealForm.status === 'won' && (
                    <div>
                      <Label>Revenue Amount ($)</Label>
                      <Input
                        type="number"
                        placeholder="10000"
                        value={dealForm.revenue}
                        onChange={(e) => setDealForm({ ...dealForm, revenue: e.target.value })}
                      />
                    </div>
                  )}

                  <div>
                    <Label>Notes (Optional)</Label>
                    <Textarea
                      placeholder="Client name, deal details..."
                      value={dealForm.notes}
                      onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })}
                    />
                  </div>

                  <Button onClick={handleLogDeal} className="w-full">
                    Log Deal
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    );
  }

  const progressPercent = stats.month.target > 0
    ? Math.min((stats.month.revenue / stats.month.target) * 100, 100)
    : 0;

  const chartData = [
    { name: 'Won', value: stats.month.dealsWon, color: '#10b981' },
    { name: 'Pending', value: stats.month.dealsPending, color: '#f59e0b' },
    { name: 'Lost', value: stats.month.dealsLost, color: '#ef4444' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sales Performance</h1>
          <p className="text-muted-foreground">Track your deals and revenue</p>
        </div>

        <Dialog open={logDealOpen} onOpenChange={setLogDealOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Log Deal
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Log Deal</DialogTitle>
              <DialogDescription>
                Record a new deal to update your performance metrics.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Deal Status</Label>
                <Select
                  value={dealForm.status}
                  onValueChange={(value) => setDealForm({ ...dealForm, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {dealForm.status === 'won' && (
                <div>
                  <Label>Revenue Amount ($)</Label>
                  <Input
                    type="number"
                    placeholder="10000"
                    value={dealForm.revenue}
                    onChange={(e) => setDealForm({ ...dealForm, revenue: e.target.value })}
                  />
                </div>
              )}

              <div>
                <Label>Notes (Optional)</Label>
                <Textarea
                  placeholder="Client name, deal details..."
                  value={dealForm.notes}
                  onChange={(e) => setDealForm({ ...dealForm, notes: e.target.value })}
                />
              </div>

              <Button onClick={handleLogDeal} className="w-full">
                Log Deal
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.month.revenue.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Target: ${stats.month.target.toLocaleString()}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deals Won</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.month.dealsWon}</div>
            <p className="text-xs text-muted-foreground">
              Pending: {stats.month.dealsPending}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Commission Earned</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.month.commission.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leaderboard Rank</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.rank ? `#${stats.rank}` : 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              of {stats.totalParticipants} reps
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Target Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Target Progress</CardTitle>
          <CardDescription>
            Your progress toward this month's revenue goal
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">
                ${stats.month.revenue.toLocaleString()} / ${stats.month.target.toLocaleString()}
              </span>
              <span className="text-sm text-muted-foreground">
                {progressPercent.toFixed(1)}%
              </span>
            </div>
            <Progress value={progressPercent} className="h-2" />
          </div>
          {progressPercent >= 100 && (
            <div className="flex items-center gap-2 text-green-600">
              <Target className="h-5 w-5" />
              <span className="font-medium">Target Achieved!</span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Deal Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>Deal Pipeline</CardTitle>
          <CardDescription>Breakdown of your deals this month</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.month.dealsWon}</p>
                <p className="text-sm text-muted-foreground">Won</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-amber-50 dark:bg-amber-950 rounded-lg">
              <Clock className="h-8 w-8 text-amber-600" />
              <div>
                <p className="text-2xl font-bold">{stats.month.dealsPending}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <XCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{stats.month.dealsLost}</p>
                <p className="text-sm text-muted-foreground">Lost</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Year to Date Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Year to Date</CardTitle>
          <CardDescription>Your total performance this year</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">
                ${stats.ytd.revenue.toLocaleString()}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Deals Won</p>
              <p className="text-2xl font-bold">{stats.ytd.dealsWon}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Total Commission</p>
              <p className="text-2xl font-bold">
                ${stats.ytd.commission.toLocaleString()}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

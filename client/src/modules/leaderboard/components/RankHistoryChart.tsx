import { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { TrendingUp, TrendingDown, Calendar } from 'lucide-react';

interface HistoryDataPoint {
  id: number;
  snapshotDate: string;
  rank: number;
  points: number;
  monthlySignups: string;
  seasonId: string | null;
}

interface RankHistoryChartProps {
  history: HistoryDataPoint[];
  className?: string;
  showToggle?: boolean;
  defaultDays?: 7 | 14 | 30;
}

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

export function RankHistoryChart({
  history,
  className = '',
  showToggle = true,
  defaultDays = 7,
}: RankHistoryChartProps) {
  const [selectedDays, setSelectedDays] = useState<7 | 14 | 30>(defaultDays);
  const [chartType, setChartType] = useState<'rank' | 'points'>('rank');

  // Filter and format data based on selected days
  const chartData = useMemo(() => {
    const now = new Date();
    const cutoffDate = new Date(now.getTime() - selectedDays * 24 * 60 * 60 * 1000);

    return history
      .filter(h => new Date(h.snapshotDate) >= cutoffDate)
      .sort((a, b) => new Date(a.snapshotDate).getTime() - new Date(b.snapshotDate).getTime())
      .map(h => ({
        date: formatDate(h.snapshotDate),
        fullDate: h.snapshotDate,
        rank: h.rank,
        points: h.points,
        signups: parseFloat(h.monthlySignups),
      }));
  }, [history, selectedDays]);

  // Calculate trend
  const trend = useMemo(() => {
    if (chartData.length < 2) return { change: 0, direction: 'neutral' as const };

    const first = chartData[0];
    const last = chartData[chartData.length - 1];

    if (chartType === 'rank') {
      const change = first.rank - last.rank; // Positive = improved (lower rank is better)
      return {
        change: Math.abs(change),
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      };
    } else {
      const change = last.points - first.points;
      const percentChange = first.points > 0 ? (change / first.points) * 100 : 0;
      return {
        change: Math.abs(percentChange),
        direction: change > 0 ? 'up' : change < 0 ? 'down' : 'neutral',
      };
    }
  }, [chartData, chartType]);

  if (history.length === 0) {
    return (
      <div className={`bg-muted/50 rounded-lg p-6 border ${className}`}>
        <div className="text-center text-muted-foreground py-8">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No historical data available yet</p>
          <p className="text-sm mt-1">Rank history will appear after daily snapshots are captured</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-muted/50 rounded-lg p-4 border ${className}`}>
      {/* Header with controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <h3 className="font-semibold">
            {chartType === 'rank' ? 'Rank History' : 'Points History'}
          </h3>
          {/* Trend indicator */}
          <div
            className={`flex items-center gap-1 text-sm px-2 py-1 rounded ${
              trend.direction === 'up'
                ? 'bg-green-500/20 text-green-500'
                : trend.direction === 'down'
                ? 'bg-red-500/20 text-red-500'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {trend.direction === 'up' ? (
              <TrendingUp className="w-3 h-3" />
            ) : trend.direction === 'down' ? (
              <TrendingDown className="w-3 h-3" />
            ) : null}
            <span>
              {chartType === 'rank'
                ? `${trend.change} ${trend.direction === 'up' ? 'places' : trend.direction === 'down' ? 'places' : ''}`
                : `${trend.change.toFixed(1)}%`}
            </span>
          </div>
        </div>

        {showToggle && (
          <div className="flex items-center gap-2">
            {/* Chart type toggle */}
            <div className="flex bg-background rounded-lg p-1">
              <button
                onClick={() => setChartType('rank')}
                className={`px-3 py-1 text-xs rounded ${
                  chartType === 'rank'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Rank
              </button>
              <button
                onClick={() => setChartType('points')}
                className={`px-3 py-1 text-xs rounded ${
                  chartType === 'points'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Points
              </button>
            </div>

            {/* Days selector */}
            <div className="flex bg-background rounded-lg p-1">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setSelectedDays(days as 7 | 14 | 30)}
                  className={`px-2 py-1 text-xs rounded ${
                    selectedDays === days
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Chart */}
      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === 'rank' ? (
            <LineChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                reversed // Lower rank = better, so reverse the axis
                domain={['dataMin - 1', 'dataMax + 1']}
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                width={30}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(value: number) => [`#${value}`, 'Rank']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Line
                type="monotone"
                dataKey="rank"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: 'hsl(var(--primary))', r: 3 }}
                activeDot={{ fill: 'hsl(var(--primary))', r: 5 }}
              />
            </LineChart>
          ) : (
            <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
              <defs>
                <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="date"
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis
                tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                width={40}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  color: 'hsl(var(--foreground))',
                }}
                formatter={(value: number) => [value.toLocaleString(), 'Points']}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Area
                type="monotone"
                dataKey="points"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                fill="url(#pointsGradient)"
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
        <div className="text-center">
          <div className="text-lg font-bold">
            #{chartData[chartData.length - 1]?.rank || '-'}
          </div>
          <div className="text-xs text-muted-foreground">Current Rank</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-green-500">
            {chartData[chartData.length - 1]?.points?.toLocaleString() || '-'}
          </div>
          <div className="text-xs text-muted-foreground">Current Points</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-primary">
            {chartData[chartData.length - 1]?.signups?.toFixed(1) || '-'}
          </div>
          <div className="text-xs text-muted-foreground">Monthly Signups</div>
        </div>
      </div>
    </div>
  );
}

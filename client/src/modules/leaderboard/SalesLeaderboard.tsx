import { useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, TrendingUp, TrendingDown, Medal, Award } from "lucide-react";
import { DualColorProgressBar } from "@/components/DualColorProgressBar";
import { RepDetailModal } from "./components/RepDetailModal";
import type { SalesRep } from "@shared/schema";

const formatCurrency = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const formatNumber = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US').format(num);
};

export function SalesLeaderboard() {
  const [sortBy, setSortBy] = useState<string>("yearlyRevenue");
  const [teamFilter, setTeamFilter] = useState<string>("all");
  const [selectedRepId, setSelectedRepId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleRepClick = useCallback((rep: SalesRep) => {
    setSelectedRepId(rep.id);
    setIsModalOpen(true);
  }, []);

  const { data: salesReps = [], isLoading } = useQuery<SalesRep[]>({
    queryKey: ['/api/sales-reps', { sortBy }],
    queryFn: async () => {
      const response = await fetch(`/api/sales-reps?sortBy=${sortBy}&sortOrder=desc`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sales reps');
      }

      return response.json();
    }
  });

  const { data: teams = [] } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['/api/teams'],
    queryFn: async () => {
      const response = await fetch('/api/teams', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch teams');
      }

      return response.json();
    }
  });

  const filteredReps = teamFilter === "all"
    ? salesReps
    : salesReps.filter(rep => rep.team === teamFilter);

  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-5 h-5 text-yellow-500" />;
      case 2:
        return <Medal className="w-5 h-5 text-gray-400" />;
      case 3:
        return <Award className="w-5 h-5 text-amber-600" />;
      default:
        return <span className="text-sm font-medium text-muted-foreground">#{rank}</span>;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Rankings</h1>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  const topPerformer = filteredReps[0];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Rankings</h1>
          <p className="text-muted-foreground">Current standings and performance metrics</p>
        </div>

        <div className="flex gap-4">
          <Select value={teamFilter} onValueChange={setTeamFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Teams" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Teams</SelectItem>
              {teams.map(team => (
                <SelectItem key={team.id} value={team.name}>{team.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthlySignups">Monthly Signups</SelectItem>
              <SelectItem value="yearlySignups">Yearly Signups</SelectItem>
              <SelectItem value="yearlyRevenue">Yearly Revenue</SelectItem>
              <SelectItem value="allTimeRevenue">All-Time Revenue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Top Performer Spotlight */}
      {topPerformer && (
        <Card className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-yellow-500" />
              Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-6">
              <Avatar className="w-20 h-20 ring-2 ring-primary">
                <AvatarImage
                  src={topPerformer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(topPerformer.name)}&background=dc2626&color=fff`}
                  alt={topPerformer.name}
                />
                <AvatarFallback>
                  {topPerformer.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h3 className="text-2xl font-bold">{topPerformer.name}</h3>
                <p className="text-muted-foreground">{topPerformer.title} • {topPerformer.team}</p>
                <div className="flex gap-6 mt-2">
                  <div>
                    <p className="text-sm text-muted-foreground">Yearly Revenue</p>
                    <p className="text-xl font-bold text-primary">{formatCurrency(topPerformer.yearlyRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Yearly Signups</p>
                    <p className="text-xl font-bold">{formatNumber(topPerformer.yearlySignups)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Progress to Goal</p>
                    <p className="text-xl font-bold text-green-500">{Math.round(parseFloat(topPerformer.goalProgress))}%</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rankings Table */}
      <Card>
        <CardHeader>
          <CardTitle>Complete Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-16">Rank</TableHead>
                <TableHead>Rep</TableHead>
                <TableHead className="text-right">Monthly</TableHead>
                <TableHead className="text-right">Yearly</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">All-Time</TableHead>
                <TableHead className="text-right">Progress</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReps.map((rep, index) => {
                const rank = index + 1;
                const isTop3 = rank <= 3;
                const goalProgress = parseFloat(rep.goalProgress);
                const yearlyGrowth = parseFloat(rep.yearlyGrowth || '0');

                return (
                  <TableRow
                    key={rep.id}
                    onClick={() => handleRepClick(rep)}
                    className={`${isTop3 ? 'bg-muted/50' : ''} cursor-pointer hover:bg-muted/70`}
                  >
                    <TableCell className="font-medium">
                      <div className="flex items-center justify-center">
                        {getRankBadge(rank)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className={`w-8 h-8 ${isTop3 ? 'ring-2 ring-primary' : ''}`}>
                          <AvatarImage
                            src={rep.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(rep.name)}&background=dc2626&color=fff`}
                            alt={rep.name}
                          />
                          <AvatarFallback>
                            {rep.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold">{rep.name}</div>
                          <div className="text-xs text-muted-foreground">{rep.team}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-semibold">{formatNumber(rep.monthlySignups)}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                        {parseFloat(rep.monthlyGrowth) >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        )}
                        <span className={parseFloat(rep.monthlyGrowth) >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {parseFloat(rep.monthlyGrowth).toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-semibold">{formatNumber(rep.yearlySignups)}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-semibold">{formatCurrency(rep.yearlyRevenue)}</div>
                      <div className="text-xs text-muted-foreground flex items-center justify-end gap-1">
                        {yearlyGrowth >= 0 ? (
                          <TrendingUp className="w-3 h-3 text-green-500" />
                        ) : (
                          <TrendingDown className="w-3 h-3 text-red-500" />
                        )}
                        <span className={yearlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                          {yearlyGrowth.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="font-semibold text-primary">{formatCurrency(rep.allTimeRevenue)}</div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-2">
                        <div className="w-24">
                          <DualColorProgressBar
                            current={goalProgress}
                            goal={100}
                            pace={70}
                            height="h-2"
                          />
                        </div>
                        <span className="text-sm font-medium w-12">{Math.round(goalProgress)}%</span>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Rep Detail Modal */}
      <RepDetailModal
        repId={selectedRepId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}

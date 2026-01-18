import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { TopPerformers } from "./components/TopPerformers";
import { AnimatedLeaderboardTable } from "./components/AnimatedLeaderboardTable";
import { PerformanceStats } from "./components/PerformanceStats";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Trophy } from "lucide-react";
import type { SalesRep } from "@/shared/schema";

export function LeaderboardDashboard() {
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedTerritory, setSelectedTerritory] = useState<string>("all");
  const [selectedRep, setSelectedRep] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("yearlyRevenue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const previousSalesRepsRef = useRef<SalesRep[]>([]);

  const { data: allSalesReps = [], isLoading, refetch } = useQuery<SalesRep[]>({
    queryKey: ['/api/sales-reps', { team: selectedTeam, territoryId: selectedTerritory, sortBy, sortOrder }],
    queryFn: async () => {
      const params = new URLSearchParams({
        team: selectedTeam,
        territoryId: selectedTerritory,
        sortBy,
        sortOrder
      });

      const response = await fetch(`/api/sales-reps?${params}`, {
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

  // Filter by individual rep
  const salesReps = selectedRep === "all"
    ? allSalesReps
    : allSalesReps.filter(rep => rep.name === selectedRep);

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

  const { data: stats } = useQuery<{
    totalRevenue: string;
    totalSignups: string;
    avgPerformance: string;
    goalsMet: string;
  }>({
    queryKey: ['/api/leaderboard/stats'],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch stats');
      }

      return response.json();
    }
  });

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Update previous reps reference
  useEffect(() => {
    if (salesReps.length > 0) {
      previousSalesRepsRef.current = [...salesReps];
    }
  }, [salesReps]);

  const handleRefresh = () => {
    refetch();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl font-semibold">Loading leaderboard...</div>
      </div>
    );
  }

  const topPerformers = salesReps.slice(0, 3);

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center">
                <Trophy className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-4xl font-bold">
                  Sales Leaderboard
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                  Real-time performance tracking with automated rank transitions
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <Select value={selectedTeam} onValueChange={(value) => {
                setSelectedTeam(value);
                setSelectedRep("all"); // Reset rep filter when team changes
              }}>
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

              <Select value={selectedRep} onValueChange={setSelectedRep}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Reps" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Reps</SelectItem>
                  {allSalesReps.map(rep => (
                    <SelectItem key={rep.id} value={rep.name}>{rep.name}</SelectItem>
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

              <Button
                onClick={handleRefresh}
                variant="default"
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <TopPerformers
          performers={topPerformers}
          rankChanges={[]}
          showRankAnimation={false}
          sortBy={sortBy}
        />

        <AnimatedLeaderboardTable
          salesReps={salesReps}
          className="bg-card rounded-lg border"
        />

        <PerformanceStats stats={stats} />
      </div>
    </div>
  );
}

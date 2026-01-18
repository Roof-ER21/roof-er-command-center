import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { TopPerformers } from "./components/TopPerformers";
import { AnimatedLeaderboardTable } from "./components/AnimatedLeaderboardTable";
import { PerformanceStats } from "./components/PerformanceStats";
import { RepDetailModal } from "./components/RepDetailModal";
import { MilestoneCelebrationModal, detectMilestones, type Milestone } from "./components/MilestoneCelebrationModal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Trophy, Wifi, WifiOff, Tv } from "lucide-react";
import { Link } from "react-router-dom";
import type { SalesRep } from "@shared/schema";
import { useLeaderboardSocket } from "@/hooks/useLeaderboardSocket";
import { useAuth } from "@/hooks/useAuth";

export function LeaderboardDashboard() {
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedTerritory, setSelectedTerritory] = useState<string>("all");
  const [selectedRep, setSelectedRep] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("yearlyRevenue");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [rankChanges, setRankChanges] = useState<Map<number, number>>(new Map());
  const previousSalesRepsRef = useRef<SalesRep[]>([]);

  // Rep detail modal state
  const [selectedRepId, setSelectedRepId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Milestone celebration state
  const [currentMilestone, setCurrentMilestone] = useState<Milestone | null>(null);

  const { user } = useAuth();

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

  // Connect to WebSocket for real-time updates
  const { connected, connecting, lastUpdate, achievements } = useLeaderboardSocket({
    userId: user?.id,
    tvDisplay: false,
    showToasts: true,
    onRankingUpdate: (update) => {
      console.log("Ranking update received:", update);
      // Trigger a refetch to get latest data
      refetch();
      // Track rank changes for animation
      setRankChanges((prev) => {
        const newChanges = new Map(prev);
        newChanges.set(update.userId, update.newRank - update.previousRank);
        // Clear after 5 seconds
        setTimeout(() => {
          setRankChanges((current) => {
            const updated = new Map(current);
            updated.delete(update.userId);
            return updated;
          });
        }, 5000);
        return newChanges;
      });
    },
    onLeaderboardRefresh: () => {
      console.log("Full leaderboard refresh triggered");
      refetch();
    },
  });

  // Auto-refresh every 30 seconds (as backup to WebSocket)
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Update previous reps reference and check for milestones
  useEffect(() => {
    if (salesReps.length > 0) {
      // Check for milestones
      if (previousSalesRepsRef.current.length > 0) {
        for (const currentRep of salesReps) {
          const previousRep = previousSalesRepsRef.current.find(r => r.id === currentRep.id);
          if (previousRep) {
            const milestones = detectMilestones(currentRep, previousRep);
            if (milestones.length > 0) {
              // Show the first milestone (could queue them)
              setCurrentMilestone(milestones[0]);
            }
          }
        }
      }
      previousSalesRepsRef.current = [...salesReps];
    }
  }, [salesReps]);

  // Handler for clicking on a rep
  const handleRepClick = useCallback((rep: SalesRep) => {
    setSelectedRepId(rep.id);
    setIsModalOpen(true);
  }, []);

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
              {/* WebSocket Connection Status */}
              <Badge
                variant={connected ? "default" : connecting ? "secondary" : "destructive"}
                className="gap-2"
              >
                {connected ? (
                  <>
                    <Wifi className="w-3 h-3" />
                    Live
                  </>
                ) : connecting ? (
                  <>
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    Connecting
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    Offline
                  </>
                )}
              </Badge>

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

              <Link to="/leaderboard/tv" target="_blank">
                <Button
                  variant="outline"
                  className="gap-2"
                >
                  <Tv className="w-4 h-4" />
                  TV Display
                </Button>
              </Link>

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
          rankChanges={Array.from(rankChanges.entries()).map(([userId, change]) => ({
            id: userId,
            previousRank: 0, // Not tracked
            currentRank: 0,  // Not tracked
            direction: change < 0 ? 'up' : change > 0 ? 'down' : 'same' as const,
          }))}
          showRankAnimation={rankChanges.size > 0}
          sortBy={sortBy}
          onPerformerClick={handleRepClick}
        />

        <AnimatedLeaderboardTable
          salesReps={salesReps}
          className="bg-card rounded-lg border"
          onRepClick={handleRepClick}
        />

        <PerformanceStats stats={stats} />

        {/* Achievement Notifications Display */}
        {achievements.length > 0 && (
          <Card className="mt-6 p-4 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
            <h3 className="text-lg font-semibold mb-3">Recent Achievements</h3>
            <div className="space-y-2">
              {achievements.slice(-3).map((achievement, index) => (
                <div key={index} className="flex items-center gap-3 text-sm">
                  <span className="text-2xl">{achievement.icon || "🏆"}</span>
                  <div>
                    <div className="font-medium">{achievement.userName}</div>
                    <div className="text-muted-foreground">
                      {achievement.title} - {achievement.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>

      {/* Rep Detail Modal */}
      <RepDetailModal
        repId={selectedRepId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />

      {/* Milestone Celebration Modal */}
      <MilestoneCelebrationModal
        milestone={currentMilestone}
        onClose={() => setCurrentMilestone(null)}
      />
    </div>
  );
}

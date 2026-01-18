import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { UsersRound, Trophy, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TeamsPage() {
  const { data: teams = [], isLoading: teamsLoading } = useQuery<any[]>({
    queryKey: ["/api/leaderboard/teams"],
    queryFn: async () => {
      const response = await fetch("/api/leaderboard/teams", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch teams");
      return response.json();
    },
  });

  const { data: salesReps = [], isLoading: repsLoading } = useQuery<any[]>({
    queryKey: ["/api/leaderboard/sales-reps"],
    queryFn: async () => {
      const response = await fetch("/api/leaderboard/sales-reps", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch sales reps");
      return response.json();
    },
  });

  const teamStats = useMemo(() => {
    const stats = teams.map((team) => {
      const reps = salesReps.filter((rep) => rep.team === team.name);
      const totalSales = reps.reduce((sum, rep) => sum + Number(rep.monthlyRevenue || 0), 0);
      const totalGrowth = reps.reduce((sum, rep) => sum + Number(rep.monthlyGrowth || 0), 0);
      const memberCount = reps.length;
      const avgGrowth = memberCount ? totalGrowth / memberCount : 0;

      return {
        id: team.id,
        name: team.name,
        members: memberCount,
        totalSales,
        monthlyGrowth: avgGrowth,
      };
    });

    return stats.sort((a, b) => b.totalSales - a.totalSales).map((team, index) => ({
      ...team,
      rank: index + 1,
    }));
  }, [teams, salesReps]);

  if (teamsLoading || repsLoading) {
    return <div className="p-8">Loading team standings...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Team Standings</h1>
        <p className="text-muted-foreground">
          Compare team performance and rankings
        </p>
      </div>

      {/* Team Rankings */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teamStats.map((team) => (
          <Card key={team.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <UsersRound className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg">{team.name}</CardTitle>
                </div>
                {team.rank <= 3 && (
                  <Badge variant={team.rank === 1 ? "default" : "secondary"}>
                    #{team.rank}
                  </Badge>
                )}
              </div>
              <CardDescription>{team.members} members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Total Sales</span>
                  <Trophy className="h-4 w-4 text-muted-foreground" />
                </div>
                <p className="text-2xl font-bold">
                  ${(team.totalSales / 1000).toFixed(0)}K
                </p>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Monthly Growth</span>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-xl font-semibold text-green-600">
                  {team.monthlyGrowth >= 0 ? "+" : ""}
                  {team.monthlyGrowth.toFixed(1)}%
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
        {teamStats.length === 0 && (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="p-8 text-center text-sm text-muted-foreground">
              No teams found.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

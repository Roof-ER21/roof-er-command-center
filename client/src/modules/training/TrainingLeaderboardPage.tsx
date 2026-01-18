import { Trophy, Medal, Star, TrendingUp } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

export function TrainingLeaderboardPage() {
  const topPerformers = [
    {
      id: 1,
      name: "Sarah Johnson",
      points: 2450,
      modulesCompleted: 12,
      avgScore: 94,
      rank: 1,
    },
    {
      id: 2,
      name: "Mike Chen",
      points: 2280,
      modulesCompleted: 11,
      avgScore: 91,
      rank: 2,
    },
    {
      id: 3,
      name: "Emily Davis",
      points: 2150,
      modulesCompleted: 10,
      avgScore: 89,
      rank: 3,
    },
    {
      id: 4,
      name: "James Wilson",
      points: 1980,
      modulesCompleted: 9,
      avgScore: 87,
      rank: 4,
    },
    {
      id: 5,
      name: "Lisa Martinez",
      points: 1850,
      modulesCompleted: 9,
      avgScore: 85,
      rank: 5,
    },
  ];

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-orange-600" />;
      default:
        return <Star className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Training Leaderboard</h1>
        <p className="text-muted-foreground">
          Top performers in training and development
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Participants</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">45</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Modules Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">428</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Average Score</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">87%</p>
          </CardContent>
        </Card>
      </div>

      {/* Leaderboard */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performers</CardTitle>
          <CardDescription>Ranked by training points and completion</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topPerformers.map((performer) => {
              const initials = performer.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase();

              return (
                <div
                  key={performer.id}
                  className="flex items-center gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center gap-3 flex-1">
                    {getRankIcon(performer.rank)}
                    <Avatar className="h-10 w-10">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="font-semibold">{performer.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {performer.modulesCompleted} modules completed
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Points</p>
                      <p className="text-lg font-bold">{performer.points.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Avg Score</p>
                      <p className="text-lg font-bold">{performer.avgScore}%</p>
                    </div>
                    <Badge
                      variant={performer.rank <= 3 ? "default" : "secondary"}
                      className="text-sm px-3"
                    >
                      #{performer.rank}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

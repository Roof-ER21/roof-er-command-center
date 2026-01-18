import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Calendar } from "lucide-react";

interface Contest {
  id: number;
  title: string;
  description?: string;
  contestType: "revenue" | "signups" | "mixed";
  participantType: "individual" | "team";
  status: "upcoming" | "active" | "completed";
  startDate: string;
  endDate: string;
  prizes?: string[];
}

export function ContestsPage() {
  const { data: contests = [], isLoading } = useQuery<Contest[]>({
    queryKey: ["/api/leaderboard/contests"],
    queryFn: async () => {
      const response = await fetch("/api/leaderboard/contests", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch contests");
      return response.json();
    },
  });

  if (isLoading) {
    return <div className="p-8">Loading contests...</div>;
  }

  const activeContests = contests.filter((contest) => contest.status === "active");
  const upcomingContests = contests.filter((contest) => contest.status === "upcoming");
  const completedContests = contests.filter((contest) => contest.status === "completed");

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "upcoming":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
    }
  };

  const renderContest = (contest: Contest) => {
    const daysRemaining = Math.max(
      0,
      Math.ceil((new Date(contest.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    );

    return (
      <Card key={contest.id}>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <CardTitle className="text-lg">{contest.title}</CardTitle>
              <CardDescription>{contest.description || "No description provided."}</CardDescription>
            </div>
            <Badge className={getStatusColor(contest.status)}>{contest.status}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              {new Date(contest.startDate).toLocaleDateString()} -{" "}
              {new Date(contest.endDate).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Trophy className="h-4 w-4 text-muted-foreground" />
            <span className="capitalize">
              {contest.contestType} • {contest.participantType}
            </span>
          </div>
          {contest.status !== "completed" && (
            <p className="text-muted-foreground">{daysRemaining} days remaining</p>
          )}
          {contest.prizes && contest.prizes.length > 0 && (
            <div>
              <p className="text-xs uppercase text-muted-foreground">Prizes</p>
              <ul className="list-disc list-inside text-sm">
                {contest.prizes.map((prize, index) => (
                  <li key={index}>{prize}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contests</h1>
        <p className="text-muted-foreground">Active competitions and prizes</p>
      </div>

      <div className="space-y-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Active Contests</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {activeContests.length > 0 ? (
              activeContests.map(renderContest)
            ) : (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No active contests right now.
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Upcoming</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingContests.length > 0 ? (
              upcomingContests.map(renderContest)
            ) : (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No upcoming contests scheduled.
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Completed</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {completedContests.length > 0 ? (
              completedContests.map(renderContest)
            ) : (
              <Card>
                <CardContent className="p-6 text-sm text-muted-foreground">
                  No completed contests yet.
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

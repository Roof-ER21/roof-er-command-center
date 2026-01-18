import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Brain, Trophy, Flame, BookOpen } from "lucide-react";

export function CoachModePage() {
  const { data: dashboard, isLoading: dashboardLoading } = useQuery<any>({
    queryKey: ["/api/training/dashboard"],
    queryFn: async () => {
      const response = await fetch("/api/training/dashboard", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch dashboard");
      return response.json();
    },
  });

  const { data: curriculum, isLoading: curriculumLoading } = useQuery<any>({
    queryKey: ["/api/training/curriculum"],
    queryFn: async () => {
      const response = await fetch("/api/training/curriculum", { credentials: "include" });
      if (!response.ok) throw new Error("Failed to fetch curriculum");
      return response.json();
    },
  });

  if (dashboardLoading || curriculumLoading) {
    return <div className="p-8">Loading coach mode...</div>;
  }

  const stats = dashboard?.data;
  const modules = curriculum?.data?.modules || [];
  const nextModule = modules.find((module: any) => !module.completed) || modules[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Coach Mode</h1>
        <p className="text-muted-foreground">AI-guided learning and coaching</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total XP</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span className="text-2xl font-bold">{stats?.totalXp || 0}</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Streak</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="text-2xl font-bold">{stats?.currentStreak || 0} days</span>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Modules Completed</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-sky-500" />
              <span className="text-2xl font-bold">
                {stats?.completedModules || 0}/{stats?.totalModules || 0}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            AI Coach Recommendations
          </CardTitle>
          <CardDescription>Next best steps based on your progress</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {nextModule ? (
            <div className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recommended Module</p>
                <p className="text-lg font-semibold">{nextModule.title}</p>
                <p className="text-sm text-muted-foreground">Score: {nextModule.score ?? "Not started"}</p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={nextModule.completed ? "secondary" : "default"}>
                  {nextModule.completed ? "Completed" : "Start Now"}
                </Badge>
                <Button asChild>
                  <Link to={`/training/modules/${nextModule.id}`}>Open Module</Link>
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No modules found.</p>
          )}

          <div className="flex flex-col gap-3 rounded-lg border p-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Practice Roleplay</p>
              <p className="text-lg font-semibold">Run a simulated homeowner conversation</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/training/roleplay">Start Roleplay</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

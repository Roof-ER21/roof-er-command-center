import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Star, Flame, Trophy, Target, Zap, Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

// Icon mapping for achievement icons
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  'star': Star,
  'flame': Flame,
  'trophy': Trophy,
  'target': Target,
  'zap': Zap,
  'award': Award,
};

export function AchievementsPage() {
  // Fetch achievements from API
  const { data, isLoading, error } = useQuery({
    queryKey: ['training', 'achievements'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/training/gamification/achievements');
      return response.data;
    },
  });

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-amber-500" />
          <p className="text-muted-foreground">Loading achievements...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load achievements</p>
          <p className="text-muted-foreground text-sm">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  const achievements = data?.achievements || [];
  const unlockedCount = data?.unlockedCount || 0;
  const totalCount = data?.totalCount || 0;
  const completionPercentage = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  // Find next locked achievement (sorted by progress)
  const nextBadge = achievements
    .filter((a: any) => !a.unlocked)
    .sort((a: any, b: any) => (b.progress || 0) - (a.progress || 0))[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Achievements</h1>
        <p className="text-muted-foreground">Track your progress and unlock badges</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unlocked</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{unlockedCount}/{totalCount}</div>
            <p className="text-xs text-muted-foreground mt-1">{completionPercentage}% complete</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">XP from Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {achievements
                .filter((a: any) => a.unlocked)
                .reduce((sum: number, a: any) => sum + (a.xpReward || 250), 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">from {unlockedCount} badges</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Next Badge</CardTitle>
          </CardHeader>
          <CardContent>
            {nextBadge ? (
              <>
                <div className="text-lg font-bold">{nextBadge.name}</div>
                <p className="text-xs text-muted-foreground mt-1">{nextBadge.description}</p>
                {nextBadge.progress > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-amber-500 transition-all"
                        style={{ width: `${nextBadge.progress}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{nextBadge.progress}% progress</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground">All badges unlocked!</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Achievement grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement: any) => {
          const IconComponent = ICON_MAP[achievement.icon] || Star;
          const formattedDate = achievement.unlockedAt
            ? new Date(achievement.unlockedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
            : null;

          return (
            <Card
              key={achievement.id}
              className={`transition-all ${
                achievement.unlocked
                  ? 'bg-gradient-to-br from-amber-500/10 to-amber-600/5'
                  : 'opacity-60'
              }`}
            >
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      achievement.unlocked
                        ? 'bg-amber-500 text-white'
                        : 'bg-muted'
                    }`}
                  >
                    <IconComponent className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{achievement.name}</h3>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                    {achievement.unlocked && formattedDate && (
                      <p className="text-xs text-amber-600 mt-2">Unlocked {formattedDate}</p>
                    )}
                    {!achievement.unlocked && achievement.progress > 0 && (
                      <div className="mt-2">
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-500/50 transition-all"
                            style={{ width: `${achievement.progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{achievement.progress}% complete</p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

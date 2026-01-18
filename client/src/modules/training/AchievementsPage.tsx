import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Star, Flame, Trophy, Target, Zap } from "lucide-react";

export function AchievementsPage() {
  const achievements = [
    { id: 1, name: "First Steps", description: "Complete your first module", icon: Star, unlocked: true, date: "Dec 15, 2024" },
    { id: 2, name: "7-Day Streak", description: "Train for 7 consecutive days", icon: Flame, unlocked: true, date: "Dec 22, 2024" },
    { id: 3, name: "Pitch Perfect", description: "Score 90% on a roleplay", icon: Target, unlocked: true, date: "Dec 28, 2024" },
    { id: 4, name: "Speed Demon", description: "Complete 5 modules in a day", icon: Zap, unlocked: false },
    { id: 5, name: "Champion", description: "Complete all 12 modules", icon: Trophy, unlocked: false },
    { id: 6, name: "Master", description: "Reach 10,000 XP", icon: Award, unlocked: false },
  ];

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
            <div className="text-3xl font-bold">3/6</div>
            <p className="text-xs text-muted-foreground mt-1">50% complete</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">XP from Badges</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">750</div>
            <p className="text-xs text-muted-foreground mt-1">250 per badge</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Next Badge</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">Speed Demon</div>
            <p className="text-xs text-muted-foreground mt-1">Complete 5 modules in a day</p>
          </CardContent>
        </Card>
      </div>

      {/* Achievement grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {achievements.map((achievement) => (
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
                  <achievement.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">{achievement.name}</h3>
                  <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  {achievement.unlocked && (
                    <p className="text-xs text-amber-600 mt-2">Unlocked {achievement.date}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

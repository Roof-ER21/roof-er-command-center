import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Target, Tv, ArrowRight, TrendingUp } from "lucide-react";

export function LeaderboardDashboard() {
  const cards = [
    { title: "Sales Rankings", description: "Current standings", icon: Trophy, href: "/leaderboard/sales", value: "View" },
    { title: "Active Contests", description: "Compete for prizes", icon: Medal, href: "/leaderboard/contests", value: "3" },
    { title: "Bonus Tracker", description: "Your earnings", icon: Target, href: "/leaderboard/bonuses", value: "$2,450" },
    { title: "TV Display", description: "Office leaderboard", icon: Tv, href: "/tv-display", value: "Launch" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Leaderboard</h1>
          <p className="text-muted-foreground">Track performance and compete with your team</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Your Rank</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">#3</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              Up 2 spots this week
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Month Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">$45,230</div>
            <p className="text-xs text-muted-foreground mt-1">87% of goal</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">12,450</div>
            <p className="text-xs text-muted-foreground mt-1">AGNU 21 level: Gold</p>
          </CardContent>
        </Card>
      </div>

      {/* Navigation cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.title} to={card.href}>
            <Card className="hover:bg-muted/50 transition-colors cursor-pointer group h-full">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                <card.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{card.value}</div>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                  <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}

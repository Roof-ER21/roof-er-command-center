import { Link } from "react-router-dom";
import { useAuth, useModuleAccess } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Trophy, GraduationCap, MapPin, ArrowRight, Clock, TrendingUp, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardPage() {
  const { user } = useAuth();
  const hasHRAccess = useModuleAccess('hr');
  const hasLeaderboardAccess = useModuleAccess('leaderboard');
  const hasTrainingAccess = useModuleAccess('training');
  const hasFieldAccess = useModuleAccess('field');

  const modules = [
    {
      id: 'hr',
      name: 'HR Management',
      description: 'PTO requests, recruiting, contracts, equipment',
      icon: Users,
      color: 'purple',
      bgClass: 'bg-purple-500/10 hover:bg-purple-500/20',
      iconClass: 'text-purple-600',
      path: '/hr',
      hasAccess: hasHRAccess,
      stats: { label: 'Pending requests', value: '5' },
    },
    {
      id: 'leaderboard',
      name: 'Sales Leaderboard',
      description: 'Rankings, contests, bonuses, TV display',
      icon: Trophy,
      color: 'green',
      bgClass: 'bg-green-500/10 hover:bg-green-500/20',
      iconClass: 'text-green-600',
      path: '/leaderboard',
      hasAccess: hasLeaderboardAccess,
      stats: { label: 'Your rank', value: '#3' },
    },
    {
      id: 'training',
      name: 'Training Center',
      description: 'AI roleplay, curriculum, achievements',
      icon: GraduationCap,
      color: 'amber',
      bgClass: 'bg-amber-500/10 hover:bg-amber-500/20',
      iconClass: 'text-amber-600',
      path: '/training',
      hasAccess: hasTrainingAccess,
      stats: { label: 'XP earned', value: '1,250' },
    },
    {
      id: 'field',
      name: 'Field Assistant',
      description: 'Susan AI chat, email generator, documents',
      icon: MapPin,
      color: 'sky',
      bgClass: 'bg-sky-500/10 hover:bg-sky-500/20',
      iconClass: 'text-sky-600',
      path: '/field',
      hasAccess: hasFieldAccess,
      stats: { label: 'Chats today', value: '12' },
    },
  ];

  const accessibleModules = modules.filter((m) => m.hasAccess);

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName || 'User'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening across your modules today.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">3 due today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">This Week</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+23%</div>
            <p className="text-xs text-muted-foreground">From last week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Logged</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32h</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <span className="h-4 w-4 flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full">
              3
            </span>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3 new</div>
            <p className="text-xs text-muted-foreground">Unread messages</p>
          </CardContent>
        </Card>
      </div>

      {/* Module cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Your Modules</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {accessibleModules.map((module) => (
            <Card
              key={module.id}
              className={cn(
                "transition-colors cursor-pointer group",
                module.bgClass
              )}
            >
              <Link to={module.path}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className={cn("p-2 rounded-lg bg-background", module.iconClass)}>
                      <module.icon className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                  <CardTitle className="text-lg mt-4">{module.name}</CardTitle>
                  <CardDescription>{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">{module.stats.label}</span>
                    <span className="text-lg font-semibold">{module.stats.value}</span>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      {accessibleModules.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-wrap gap-3">
            {hasTrainingAccess && (
              <Button asChild variant="outline">
                <Link to="/training/roleplay">Start AI Roleplay</Link>
              </Button>
            )}
            {hasFieldAccess && (
              <Button asChild variant="outline">
                <Link to="/field/chat">Chat with Susan</Link>
              </Button>
            )}
            {hasHRAccess && (
              <Button asChild variant="outline">
                <Link to="/hr/pto">Request PTO</Link>
              </Button>
            )}
            {hasLeaderboardAccess && (
              <Button asChild variant="outline">
                <Link to="/leaderboard/sales">View Rankings</Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

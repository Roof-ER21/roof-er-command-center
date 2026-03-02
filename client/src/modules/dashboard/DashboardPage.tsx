import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Target, Briefcase, Trophy, Bell, DollarSign, FileCheck,
  Hammer, Shield, Archive, GraduationCap, MapPin,
  ArrowRight, TrendingUp, CheckCircle, Clock, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardPage() {
  const { user } = useAuth();

  const modules = [
    {
      id: 'pipeline',
      name: 'Pipeline',
      description: 'Active leads and canvassing sessions',
      icon: Target,
      bgClass: 'bg-blue-500/10 hover:bg-blue-500/20',
      iconClass: 'text-blue-600',
      path: '/pipeline/leads',
      stats: { label: 'Active leads', value: '0' },
    },
    {
      id: 'jobs',
      name: 'Jobs Dashboard',
      description: '8 master categories, insurance & retail pipelines',
      icon: Briefcase,
      bgClass: 'bg-indigo-500/10 hover:bg-indigo-500/20',
      iconClass: 'text-indigo-600',
      path: '/jobs',
      stats: { label: 'Active jobs', value: '0' },
    },
    {
      id: 'leaderboard',
      name: 'Leaderboard',
      description: 'Sign-ups, revenue, upsells, commission preview',
      icon: Trophy,
      bgClass: 'bg-green-500/10 hover:bg-green-500/20',
      iconClass: 'text-green-600',
      path: '/leaderboard',
      stats: { label: 'Your rank', value: '—' },
    },
    {
      id: 'billing',
      name: 'Billing & Recovery',
      description: 'Downpayment tracker, A/R aging, QuickBooks sync',
      icon: DollarSign,
      bgClass: 'bg-emerald-500/10 hover:bg-emerald-500/20',
      iconClass: 'text-emerald-600',
      path: '/billing',
      stats: { label: 'Outstanding', value: '$0' },
    },
    {
      id: 'claims',
      name: 'Claims Center',
      description: 'Supplements, carrier correspondence, 7-stage Kanban',
      icon: FileCheck,
      bgClass: 'bg-purple-500/10 hover:bg-purple-500/20',
      iconClass: 'text-purple-600',
      path: '/claims',
      stats: { label: 'Active supplements', value: '0' },
    },
    {
      id: 'production',
      name: 'Production Hub',
      description: 'Materials, crew scheduling, QC, punch-outs',
      icon: Hammer,
      bgClass: 'bg-orange-500/10 hover:bg-orange-500/20',
      iconClass: 'text-orange-600',
      path: '/production',
      stats: { label: 'In production', value: '0' },
    },
    {
      id: 'training',
      name: 'Training Center',
      description: 'AI roleplay, curriculum, achievements, certifications',
      icon: GraduationCap,
      bgClass: 'bg-amber-500/10 hover:bg-amber-500/20',
      iconClass: 'text-amber-600',
      path: '/training',
      stats: { label: 'XP earned', value: '0' },
    },
    {
      id: 'field',
      name: 'Field Assistant',
      description: 'Susan AI chat, email generator, documents',
      icon: MapPin,
      bgClass: 'bg-sky-500/10 hover:bg-sky-500/20',
      iconClass: 'text-sky-600',
      path: '/field',
      stats: { label: 'Chats today', value: '0' },
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.firstName || 'User'}
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening across your operations today.
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Across all stages</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue (MTD)</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$0</div>
            <p className="text-xs text-muted-foreground">Recognized this month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Tasks</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">0 due today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Unread alerts</p>
          </CardContent>
        </Card>
      </div>

      {/* Module cards */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Command Center</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {modules.map((module) => (
            <Card
              key={module.id}
              className={cn(
                "transition-colors cursor-pointer group",
                module.bgClass
              )}
            >
              <Link to={module.path}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className={cn("p-2 rounded-lg bg-background", module.iconClass)}>
                      <module.icon className="h-5 w-5" />
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:translate-x-1 transition-transform" />
                  </div>
                  <CardTitle className="text-sm mt-3">{module.name}</CardTitle>
                  <CardDescription className="text-xs">{module.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{module.stats.label}</span>
                    <span className="text-sm font-semibold">{module.stats.value}</span>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link to="/pipeline/leads">New Lead</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/jobs">View Jobs</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/leaderboard">Leaderboard</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/training/roleplay">Start AI Roleplay</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/field/chat">Chat with Susan</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/users">Manage Users</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

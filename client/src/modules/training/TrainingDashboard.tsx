import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  MessageCircle,
  BookOpen,
  Award,
  Flame,
  Star,
  Play,
  TrendingUp,
  Target,
  Calendar,
  ChevronRight,
  History,
  Trophy,
  Loader2,
  Home,
  ShoppingCart
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useState } from "react";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
  bgColor: string;
  borderColor: string;
}

interface TrainingStats {
  totalSessions: number;
  avgScore: number;
  currentStreak: number;
  totalXP: number;
  currentLevel: number;
  weeklyGoalProgress: number;
  achievements: number;
}

export function TrainingDashboard() {
  const { user } = useAuth();
  const [activeDivision, setActiveDivision] = useState<'insurance' | 'retail'>((user?.division as 'insurance' | 'retail') || 'insurance');

  // Fetch training stats from API
  const { data: statsData, isLoading, error } = useQuery({
    queryKey: ['training', 'dashboard', user?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/training/dashboard');
      return response.data;
    },
    enabled: !!user?.id,
  });

  // Map API response to expected stats format
  const stats: TrainingStats = {
    totalSessions: statsData?.totalSessions || 0,
    avgScore: statsData?.avgScore || 0,
    currentStreak: statsData?.currentStreak || 0,
    totalXP: statsData?.totalXp || 0,
    currentLevel: typeof statsData?.level === 'number' ? statsData.level : 1,
    weeklyGoalProgress: Math.min(100, Math.round(((statsData?.completedModules || 0) / 5) * 100)), // 5 modules = 100%
    achievements: statsData?.achievements || 0,
  };

  const quickActions: QuickAction[] = [
    {
      id: 'coach',
      title: 'Coach Mode',
      description: 'AI-guided learning',
      icon: MessageCircle,
      href: '/training/coach',
      color: 'text-red-400',
      bgColor: 'bg-red-600/20',
      borderColor: 'border-red-500/50'
    },
    {
      id: 'roleplay',
      title: 'Roleplay',
      description: 'Practice with AI',
      icon: Play,
      href: '/training/roleplay',
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-600/20',
      borderColor: 'border-cyan-500/50'
    },
    {
      id: 'curriculum',
      title: 'Curriculum',
      description: '12-module training',
      icon: BookOpen,
      href: '/training/curriculum',
      color: 'text-purple-400',
      bgColor: 'bg-purple-600/20',
      borderColor: 'border-purple-500/50'
    },
    {
      id: 'achievements',
      title: 'Achievements',
      description: 'View your badges',
      icon: Trophy,
      href: '/training/achievements',
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-600/20',
      borderColor: 'border-yellow-500/50'
    }
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-red-500" />
          <p className="text-muted-foreground">Loading your training data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-red-500 mb-2">Failed to load training data</p>
          <p className="text-muted-foreground text-sm">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto p-6">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-3">
          <p className="text-muted-foreground text-sm">{getGreeting()}</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            Welcome back, <span className="text-red-500">{user?.firstName || 'there'}</span>!
          </h1>
        </div>

        {/* Division Toggle */}
        <div className="flex items-center bg-muted/50 rounded-full p-1 border">
          <button
            onClick={() => setActiveDivision('insurance')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeDivision === 'insurance'
                ? 'bg-red-600 text-white shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Insurance</span>
          </button>
          <button
            onClick={() => setActiveDivision('retail')}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${
              activeDivision === 'retail'
                ? 'bg-emerald-600 text-white shadow-lg'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Retail</span>
          </button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Current Streak */}
        <Card className="p-4 bg-gradient-to-br from-orange-900/30 to-orange-900/10 border-orange-500/30">
          <div className="flex items-center space-x-2 mb-2">
            <Flame className="w-5 h-5 text-orange-400" />
            <span className="text-xs text-orange-300 uppercase tracking-wider">Streak</span>
          </div>
          <div className="text-3xl font-bold text-orange-400">{stats.currentStreak}</div>
          <div className="text-xs text-muted-foreground">days</div>
        </Card>

        {/* Avg Score */}
        <Card className="p-4 bg-gradient-to-br from-green-900/30 to-green-900/10 border-green-500/30">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <span className="text-xs text-green-300 uppercase tracking-wider">Avg Score</span>
          </div>
          <div className="text-3xl font-bold text-green-400">
            {stats.avgScore > 0 ? `${stats.avgScore}%` : '-'}
          </div>
          <div className="text-xs text-muted-foreground">
            {stats.totalSessions > 0 ? 'roleplay sessions' : 'no sessions yet'}
          </div>
        </Card>

        {/* Level */}
        <Card className="p-4 bg-gradient-to-br from-purple-900/30 to-purple-900/10 border-purple-500/30">
          <div className="flex items-center space-x-2 mb-2">
            <Award className="w-5 h-5 text-purple-400" />
            <span className="text-xs text-purple-300 uppercase tracking-wider">Level</span>
          </div>
          <div className="text-3xl font-bold text-purple-400">{stats.currentLevel}</div>
          <div className="text-xs text-muted-foreground">{stats.totalXP} XP</div>
        </Card>

        {/* Sessions */}
        <Card className="p-4 bg-gradient-to-br from-blue-900/30 to-blue-900/10 border-blue-500/30">
          <div className="flex items-center space-x-2 mb-2">
            <Target className="w-5 h-5 text-blue-400" />
            <span className="text-xs text-blue-300 uppercase tracking-wider">Sessions</span>
          </div>
          <div className="text-3xl font-bold text-blue-400">{stats.totalSessions}</div>
          <div className="text-xs text-muted-foreground">completed</div>
        </Card>
      </div>

      {/* Weekly Goal Progress */}
      <Card className="p-5 bg-card/80 border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-yellow-400" />
            <span className="text-sm font-medium">Weekly Goal</span>
          </div>
          <span className="text-xs text-muted-foreground">{stats.weeklyGoalProgress}% complete</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-600 to-yellow-400 transition-all duration-500"
            style={{ width: `${stats.weeklyGoalProgress}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          Complete 5 training sessions this week to earn bonus XP!
        </p>
      </Card>

      {/* Level Progress Bar */}
      <Card className="p-5 bg-card/80 border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Star className="w-5 h-5 text-amber-400" />
            <span className="text-sm font-medium">Level {stats.currentLevel}</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {stats.totalXP} / {(stats.currentLevel + 1) * 500} XP
          </span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-400 transition-all duration-500"
            style={{ width: `${((stats.totalXP % 500) / 500) * 100}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          {((stats.currentLevel + 1) * 500) - stats.totalXP} XP to Level {stats.currentLevel + 1}
        </p>
      </Card>

      {/* Quick Actions */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Quick Actions</h2>

        <div className="grid grid-cols-2 gap-3">
          {quickActions.map((action) => (
            <Link key={action.id} to={action.href}>
              <Card
                className={`group p-5 ${action.bgColor} border ${action.borderColor} transition-all duration-300 hover:scale-[1.02] cursor-pointer`}
              >
                <div className={`${action.color} mb-3`}>
                  <action.icon className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold mb-1">{action.title}</h3>
                <p className="text-xs text-muted-foreground">{action.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* View History Link */}
      <Link to="/training/history">
        <Card className="group p-4 bg-card/50 hover:bg-card border hover:border-red-500/30 transition-all duration-300 cursor-pointer">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <History className="w-5 h-5 text-red-400" />
              <div className="text-left">
                <h3 className="font-medium">View Training History</h3>
                <p className="text-xs text-muted-foreground">See your past sessions and analytics</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-red-400 group-hover:translate-x-1 transition-all" />
          </div>
        </Card>
      </Link>

      {/* Start Training CTA */}
      <div className="flex justify-center pt-6">
        <Button asChild size="lg" className="bg-gradient-to-r from-red-700 to-red-600 hover:from-red-800 hover:to-red-700">
          <Link to="/training/roleplay">
            <Play className="mr-2 h-5 w-5" />
            Start Training Session
          </Link>
        </Button>
      </div>
    </div>
  );
}

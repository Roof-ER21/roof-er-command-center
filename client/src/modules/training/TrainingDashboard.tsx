import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GraduationCap, MessageCircle, BookOpen, Award, Flame, Star, ArrowRight, Play } from "lucide-react";
import { CURRICULUM_MODULES } from "@shared/constants";

export function TrainingDashboard() {
  const cards = [
    { title: "Coach Mode", description: "AI-guided learning", icon: MessageCircle, href: "/training/coach" },
    { title: "Roleplay", description: "Practice with AI", icon: Play, href: "/training/roleplay" },
    { title: "Curriculum", description: "12-module training", icon: BookOpen, href: "/training/curriculum" },
    { title: "Achievements", description: "Your badges", icon: Award, href: "/training/achievements" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Training Center</h1>
          <p className="text-muted-foreground">Level up your roofing sales skills</p>
        </div>
        <Button asChild className="bg-amber-500 hover:bg-amber-600">
          <Link to="/training/roleplay">
            <Play className="mr-2 h-4 w-4" />
            Start Training
          </Link>
        </Button>
      </div>

      {/* Progress stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Star className="h-4 w-4 text-amber-500" />
              Total XP
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">1,250</div>
            <p className="text-xs text-muted-foreground mt-1">Level: Intermediate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Flame className="h-4 w-4 text-orange-500" />
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">7 days</div>
            <p className="text-xs text-muted-foreground mt-1">Keep it going!</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              Modules Done
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">8/12</div>
            <p className="text-xs text-muted-foreground mt-1">67% complete</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-purple-500" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">15</div>
            <p className="text-xs text-muted-foreground mt-1">3 this week</p>
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
                <CardDescription>{card.description}</CardDescription>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-2" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Curriculum overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5" />
            Training Curriculum
          </CardTitle>
          <CardDescription>Complete all 12 modules to become a certified roofing sales pro</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
            {CURRICULUM_MODULES.map((module, index) => (
              <div
                key={module.id}
                className={`flex items-center gap-3 p-3 rounded-lg ${
                  index < 8 ? 'bg-green-500/10' : 'bg-muted'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index < 8 ? 'bg-green-500 text-white' : 'bg-muted-foreground/20'
                }`}>
                  {index < 8 ? '✓' : module.id}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{module.title}</p>
                  <p className="text-xs text-muted-foreground capitalize">{module.type}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

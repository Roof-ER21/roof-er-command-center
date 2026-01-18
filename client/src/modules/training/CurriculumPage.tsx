import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CURRICULUM_MODULES } from "@shared/constants";
import { Play, CheckCircle, Lock, BookOpen, Gamepad2, Mic, Brain } from "lucide-react";

const getModuleIcon = (type: string) => {
  switch (type) {
    case 'content':
      return BookOpen;
    case 'script':
      return Mic;
    case 'game':
      return Gamepad2;
    case 'ai-chat':
      return Brain;
    case 'quiz':
      return Brain;
    default:
      return BookOpen;
  }
};

export function CurriculumPage() {
  const completedModules = 8; // This will come from API

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Training Curriculum</h1>
        <p className="text-muted-foreground">Complete all 12 modules to become certified</p>
      </div>

      {/* Progress bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm text-muted-foreground">{completedModules}/12 complete</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 rounded-full transition-all"
              style={{ width: `${(completedModules / 12) * 100}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Module list */}
      <div className="space-y-4">
        {CURRICULUM_MODULES.map((module, index) => {
          const isCompleted = index < completedModules;
          const isLocked = index > completedModules;
          const isCurrent = index === completedModules;
          const ModuleIcon = getModuleIcon(module.type);

          return (
            <Card
              key={module.id}
              className={`transition-all ${
                isLocked ? 'opacity-60' : isCurrent ? 'ring-2 ring-amber-500' : ''
              }`}
            >
              <CardHeader className="flex flex-row items-center gap-4 space-y-0">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-amber-500 text-white'
                      : 'bg-muted'
                  }`}
                >
                  {isCompleted ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : isLocked ? (
                    <Lock className="h-5 w-5" />
                  ) : (
                    <span className="font-bold">{module.id}</span>
                  )}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">{module.title}</CardTitle>
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <ModuleIcon className="h-4 w-4" />
                    <span className="capitalize">{module.type.replace('-', ' ')}</span>
                  </CardDescription>
                </div>
                <div>
                  {isCompleted ? (
                    <Button variant="outline" size="sm">
                      Review
                    </Button>
                  ) : isCurrent ? (
                    <Button size="sm" className="bg-amber-500 hover:bg-amber-600">
                      <Play className="mr-2 h-4 w-4" />
                      Start
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" disabled>
                      Locked
                    </Button>
                  )}
                </div>
              </CardHeader>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Mic,
  Gamepad2,
  Brain,
  CheckCircle,
  ArrowLeft,
  ArrowRight,
  Clock,
  Trophy,
  Lightbulb,
  Loader2,
  Sparkles
} from "lucide-react";
import { getModuleById, type CurriculumModule } from "../data/curriculum";
import { ObjectionGame } from "../components/ObjectionGame";
import { SalesCycleGame } from "../components/SalesCycleGame";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const getModuleIcon = (type: string) => {
  switch (type) {
    case 'content': return BookOpen;
    case 'script': return Mic;
    case 'game': return Gamepad2;
    case 'ai-chat': return Brain;
    case 'quiz': return Brain;
    default: return BookOpen;
  }
};

export function ModulePage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [isCompleted, setIsCompleted] = useState(false);
  const [xpGained, setXpGained] = useState<number | null>(null);
  const [leveledUp, setLeveledUp] = useState(false);

  const module = getModuleById(Number(moduleId));

  // Mutation for completing a module
  const completeMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/training/modules/${moduleId}/complete`, {
        xpReward: module?.xpReward || 100,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setIsCompleted(true);
      setXpGained(data.xpAwarded);
      setLeveledUp(data.leveledUp);

      // Invalidate training queries to refresh dashboard
      queryClient.invalidateQueries({ queryKey: ['training'] });

      // Show success toast
      if (!data.alreadyCompleted) {
        toast({
          title: "Module Completed!",
          description: `You earned ${data.xpAwarded} XP!${data.leveledUp ? ' 🎉 Level Up!' : ''}`,
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to complete module",
        variant: "destructive",
      });
    },
  });

  if (!module) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Module Not Found</h2>
          <p className="text-muted-foreground mb-4">The requested module could not be found.</p>
          <Button onClick={() => navigate("/training/curriculum")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Curriculum
          </Button>
        </div>
      </div>
    );
  }

  const handleComplete = () => {
    completeMutation.mutate();
  };

  const handleNext = () => {
    if (module.id < 12) {
      navigate(`/training/modules/${module.id + 1}`);
    } else {
      navigate("/training/curriculum");
    }
  };

  const ModuleIcon = getModuleIcon(module.type);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={() => navigate("/training/curriculum")}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Curriculum
        </Button>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            {module.estimatedMinutes} min
          </Badge>
          <Badge variant="outline" className="gap-1">
            <Trophy className="h-3 w-3" />
            {module.xpReward} XP
          </Badge>
        </div>
      </div>

      {/* Module Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0">
              <ModuleIcon className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-medium text-muted-foreground">Module {module.id} of 12</span>
                {isCompleted && (
                  <Badge variant="default" className="bg-green-500 gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Completed
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl mb-2">{module.title}</CardTitle>
              <CardDescription className="text-base">{module.description}</CardDescription>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Module Content */}
      {module.type === 'content' && <ContentView module={module} />}
      {module.type === 'script' && <ScriptView module={module} />}
      {module.type === 'game' && <GameView module={module} />}
      {module.type === 'ai-chat' && <AIRoleplayView module={module} />}
      {module.type === 'quiz' && <QuizView module={module} />}

      {/* Completion Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              {!isCompleted ? (
                <>
                  <h3 className="font-semibold mb-1">Ready to move on?</h3>
                  <p className="text-sm text-muted-foreground">
                    Mark this module complete to unlock the next one and earn {module.xpReward} XP
                  </p>
                </>
              ) : (
                <>
                  <h3 className="font-semibold mb-1 text-green-600 flex items-center gap-2">
                    Module Completed!
                    {leveledUp && (
                      <Badge className="bg-purple-500 animate-pulse">
                        <Sparkles className="h-3 w-3 mr-1" />
                        Level Up!
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    {xpGained !== null && xpGained > 0 ? (
                      <span className="text-amber-500 font-semibold">+{xpGained} XP</span>
                    ) : null}
                    Continue to the next module.
                  </p>
                </>
              )}
            </div>

            <div className="flex gap-2">
              {!isCompleted ? (
                <Button
                  onClick={handleComplete}
                  className="bg-amber-500 hover:bg-amber-600"
                  disabled={completeMutation.isPending}
                >
                  {completeMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Completing...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Mark Complete
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext} className="bg-amber-500 hover:bg-amber-600">
                  {module.id < 12 ? "Next Module" : "Back to Curriculum"}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Content Module View
function ContentView({ module }: { module: CurriculumModule }) {
  if (!module.content) return null;

  return (
    <div className="space-y-4">
      {module.content.sections.map((section, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-xl">{section.heading}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground leading-relaxed">{section.body}</p>

            {section.bulletPoints && section.bulletPoints.length > 0 && (
              <ul className="space-y-2 ml-4">
                {section.bulletPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}

            {section.keyTakeaways && section.keyTakeaways.length > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Lightbulb className="h-5 w-5 text-amber-600" />
                  <h4 className="font-semibold text-amber-900 dark:text-amber-100">Key Takeaways</h4>
                </div>
                <ul className="space-y-1 ml-4">
                  {section.keyTakeaways.map((takeaway, i) => (
                    <li key={i} className="flex items-start gap-2 text-amber-800 dark:text-amber-200">
                      <span className="mt-1">✓</span>
                      <span>{takeaway}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// Script Module View
function ScriptView({ module }: { module: CurriculumModule }) {
  if (!module.script) return null;

  return (
    <div className="space-y-4">
      {/* Scenario */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Scenario</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground italic">{module.script.scenario}</p>
        </CardContent>
      </Card>

      {/* Script */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Mic className="h-5 w-5" />
            The Script
          </CardTitle>
          <CardDescription>Study and practice this script until it becomes natural</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-6 rounded-lg">
            <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
              {module.script.script}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Tips */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-amber-500" />
            Pro Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {module.script.tips.map((tip, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-amber-500 mt-1">💡</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Practice Prompts */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Practice Exercises</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {module.script.practicePrompts.map((prompt, index) => (
              <li key={index} className="flex items-start gap-2">
                <span className="text-green-500 mt-1">✓</span>
                <span>{prompt}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// Game Module View
function GameView({ module }: { module: CurriculumModule }) {
  if (!module.game) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl flex items-center gap-2">
          <Gamepad2 className="h-5 w-5 text-amber-500" />
          Interactive Training Game
        </CardTitle>
        <CardDescription>{module.game.instructions}</CardDescription>
      </CardHeader>
      <CardContent>
        {module.game.type === 'objection-handling' && (
          <ObjectionGame items={module.game.items as any} />
        )}
        {module.game.type === 'sales-cycle' && (
          <SalesCycleGame items={module.game.items as any} />
        )}
      </CardContent>
    </Card>
  );
}

// AI Roleplay View
function AIRoleplayView({ module }: { module: CurriculumModule }) {
  return (
    <div className="space-y-4">
      {module.content?.sections.map((section, index) => (
        <Card key={index}>
          <CardHeader>
            <CardTitle className="text-xl">{section.heading}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">{section.body}</p>
            {section.bulletPoints && (
              <ul className="space-y-2 ml-4">
                {section.bulletPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      ))}

      {/* AI Chat Interface */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-500" />
            AI Role-Play Session
          </CardTitle>
          <CardDescription>Practice with an AI homeowner simulation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted p-8 rounded-lg text-center">
            <Brain className="h-12 w-12 mx-auto mb-4 text-purple-500" />
            <h3 className="text-lg font-semibold mb-2">AI Role-Play Coming Soon</h3>
            <p className="text-muted-foreground mb-4">
              This feature will allow you to practice your pitch with an AI-powered homeowner
              that provides realistic objections and detailed performance feedback.
            </p>
            <Button variant="outline" disabled>
              Start AI Session
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Quiz View
function QuizView({ module }: { module: CurriculumModule }) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);

  if (!module.quiz) return null;

  const handleSelectAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNext = () => {
    if (module.quiz && currentQuestion < module.quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    if (!module.quiz) return 0;
    let correct = 0;
    module.quiz.questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / module.quiz.questions.length) * 100);
  };

  const question = module.quiz?.questions[currentQuestion];
  const progress = module.quiz ? ((currentQuestion + 1) / module.quiz.questions.length) * 100 : 0;

  if (showResults) {
    const score = calculateScore();
    const passed = module.quiz ? score >= module.quiz.passingScore : false;

    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Quiz Results</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <div className={`text-6xl font-bold mb-2 ${passed ? 'text-green-500' : 'text-red-500'}`}>
              {score}%
            </div>
            <p className="text-lg mb-4">
              {passed ? (
                <span className="text-green-600 font-semibold">Congratulations! You passed! 🎉</span>
              ) : (
                <span className="text-red-600 font-semibold">You need {module.quiz.passingScore}% to pass. Try again!</span>
              )}
            </p>
            <p className="text-muted-foreground">
              You answered {module.quiz ? selectedAnswers.filter((a, i) => a === module.quiz!.questions[i].correctAnswer).length : 0} out of {module.quiz?.questions.length || 0} questions correctly.
            </p>
          </div>

          <Separator />

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Review Your Answers</h3>
            {module.quiz.questions.map((q, index) => {
              const isCorrect = selectedAnswers[index] === q.correctAnswer;
              return (
                <div key={q.id} className={`p-4 rounded-lg border-2 ${isCorrect ? 'border-green-200 bg-green-50 dark:bg-green-950' : 'border-red-200 bg-red-50 dark:bg-red-950'}`}>
                  <div className="flex items-start gap-2 mb-2">
                    {isCorrect ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <span className="text-red-600 font-bold">✗</span>
                    )}
                    <div className="flex-1">
                      <p className="font-medium mb-2">{index + 1}. {q.question}</p>
                      {!isCorrect && (
                        <>
                          <p className="text-sm text-red-700 dark:text-red-300 mb-1">
                            Your answer: {q.options[selectedAnswers[index]]}
                          </p>
                          <p className="text-sm text-green-700 dark:text-green-300 mb-1">
                            Correct answer: {q.options[q.correctAnswer]}
                          </p>
                        </>
                      )}
                      <p className="text-sm text-muted-foreground italic mt-2">{q.explanation}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex justify-center gap-4">
            {!passed && (
              <Button onClick={() => {
                setShowResults(false);
                setCurrentQuestion(0);
                setSelectedAnswers([]);
              }} variant="outline">
                Retake Quiz
              </Button>
            )}
            <Button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="bg-amber-500 hover:bg-amber-600">
              {passed ? "Complete Module" : "Review & Try Again"}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Question {currentQuestion + 1} of {module.quiz.questions.length}</span>
            <span>Passing Score: {module.quiz.passingScore}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <h3 className="text-xl font-semibold mb-4">{question.question}</h3>
          <div className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelectAnswer(index)}
                className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                  selectedAnswers[currentQuestion] === index
                    ? 'border-amber-500 bg-amber-50 dark:bg-amber-950'
                    : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50 dark:hover:bg-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    selectedAnswers[currentQuestion] === index
                      ? 'border-amber-500 bg-amber-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedAnswers[currentQuestion] === index && (
                      <CheckCircle className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <span>{option}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between pt-4">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Previous
          </Button>

          {currentQuestion < module.quiz.questions.length - 1 ? (
            <Button
              onClick={handleNext}
              disabled={selectedAnswers[currentQuestion] === undefined}
              className="bg-amber-500 hover:bg-amber-600"
            >
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswers.length !== module.quiz.questions.length}
              className="bg-green-500 hover:bg-green-600"
            >
              Submit Quiz
              <CheckCircle className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

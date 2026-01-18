import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, XCircle, AlertCircle, RotateCcw, Trophy } from "lucide-react";
import type { ObjectionItem } from "../data/curriculum";

interface ObjectionGameProps {
  items: ObjectionItem[];
}

export function ObjectionGame({ items }: ObjectionGameProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [completed, setCompleted] = useState(false);

  const currentItem = items[currentIndex];
  const progress = ((currentIndex + 1) / items.length) * 100;

  const handleSelectAnswer = (index: number) => {
    if (showFeedback) return; // Prevent changing answer after selection

    setSelectedAnswer(index);
    setShowFeedback(true);

    // Update score if correct
    if (currentItem.responses[index].isCorrect) {
      setScore(score + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      setCompleted(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);
    setCompleted(false);
  };

  if (completed) {
    const percentage = Math.round((score / items.length) * 100);
    const isPerfect = score === items.length;
    const isGood = percentage >= 70;

    return (
      <div className="space-y-6">
        <Card className="border-2 border-amber-500">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center mx-auto">
                <Trophy className="h-10 w-10 text-amber-600" />
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-2">
                  {isPerfect ? "Perfect Score! 🎉" : isGood ? "Great Job! 👏" : "Keep Practicing! 💪"}
                </h3>
                <p className="text-4xl font-bold text-amber-600 mb-2">{score}/{items.length}</p>
                <p className="text-lg text-muted-foreground">
                  {percentage}% correct
                </p>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  {isPerfect
                    ? "Outstanding! You've mastered objection handling. You're ready to handle any homeowner concern with confidence."
                    : isGood
                    ? "You're doing well! Review the feedback on missed questions to refine your approach even further."
                    : "Objection handling takes practice. Review the correct responses and try again to improve your skills."}
                </p>
              </div>

              <Button onClick={handleRestart} className="bg-amber-500 hover:bg-amber-600">
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Review incorrect answers */}
        {score < items.length && (
          <div className="space-y-4">
            <h4 className="font-semibold text-lg">Review Your Responses</h4>
            {items.map((item, itemIndex) => {
              // You would need to track user selections to show this properly
              // For now, we'll just show all objections
              return (
                <Card key={itemIndex}>
                  <CardContent className="pt-6">
                    <p className="font-medium mb-3 flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                      <span>"{item.objection}"</span>
                    </p>
                    {item.responses.map((response, respIndex) => (
                      response.isCorrect && (
                        <div key={respIndex} className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-3 ml-7">
                          <p className="text-sm mb-2 flex items-start gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
                            <span className="font-medium">Best Response:</span>
                          </p>
                          <p className="text-sm mb-2 ml-6">{response.text}</p>
                          <p className="text-sm text-muted-foreground italic ml-6">{response.feedback}</p>
                        </div>
                      )
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-sm text-muted-foreground mb-2">
          <span>Objection {currentIndex + 1} of {items.length}</span>
          <span>Score: {score}/{currentIndex + (showFeedback ? 1 : 0)}</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Current Objection */}
      <Card className="border-2 border-amber-200 dark:border-amber-900">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3 mb-6">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950 flex items-center justify-center shrink-0">
              <AlertCircle className="h-5 w-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <Badge variant="outline" className="mb-2">Homeowner Objection</Badge>
              <p className="text-lg font-medium leading-relaxed">
                "{currentItem.objection}"
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground mb-3">
              How would you respond? Select the most effective response:
            </p>

            {currentItem.responses.map((response, index) => {
              const isSelected = selectedAnswer === index;
              const isCorrect = response.isCorrect;
              const showCorrect = showFeedback && isCorrect;
              const showIncorrect = showFeedback && isSelected && !isCorrect;

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(index)}
                  disabled={showFeedback}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                    showCorrect
                      ? 'border-green-500 bg-green-50 dark:bg-green-950'
                      : showIncorrect
                      ? 'border-red-500 bg-red-50 dark:bg-red-950'
                      : isSelected
                      ? 'border-amber-500 bg-amber-50 dark:bg-amber-950'
                      : 'border-gray-200 hover:border-amber-300 hover:bg-gray-50 dark:hover:bg-gray-900'
                  } ${showFeedback ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="shrink-0 mt-1">
                      {showCorrect ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : showIncorrect ? (
                        <XCircle className="h-5 w-5 text-red-600" />
                      ) : (
                        <div className={`w-5 h-5 rounded-full border-2 ${
                          isSelected ? 'border-amber-500 bg-amber-500' : 'border-gray-300'
                        }`}>
                          {isSelected && !showFeedback && (
                            <div className="w-full h-full rounded-full bg-white scale-50" />
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2">
                      <p className="text-sm">{response.text}</p>

                      {showFeedback && (isSelected || isCorrect) && (
                        <div className={`text-sm italic ${
                          isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'
                        }`}>
                          {response.feedback}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {showFeedback && (
            <div className="mt-6 flex justify-end">
              <Button onClick={handleNext} className="bg-amber-500 hover:bg-amber-600">
                {currentIndex < items.length - 1 ? "Next Objection" : "See Results"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      {!showFeedback && (
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardContent className="pt-4 pb-4">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Tip:</strong> In real situations, there may be multiple valid responses.
              This game highlights the most effective approach based on proven sales techniques.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

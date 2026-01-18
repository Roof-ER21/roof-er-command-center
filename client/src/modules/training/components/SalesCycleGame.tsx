import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, GripVertical, RotateCcw, Trophy, AlertCircle } from "lucide-react";
import type { SalesCycleItem } from "../data/curriculum";

interface SalesCycleGameProps {
  items: SalesCycleItem[];
}

export function SalesCycleGame({ items }: SalesCycleGameProps) {
  const [shuffledItems, setShuffledItems] = useState<SalesCycleItem[]>([]);
  const [userOrder, setUserOrder] = useState<SalesCycleItem[]>([]);
  const [draggedItem, setDraggedItem] = useState<SalesCycleItem | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  // Shuffle items on mount
  useEffect(() => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setShuffledItems(shuffled);
    setUserOrder(shuffled);
  }, [items]);

  const handleDragStart = (item: SalesCycleItem) => {
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (dropIndex: number) => {
    if (!draggedItem) return;

    const draggedIndex = userOrder.findIndex((item) => item.id === draggedItem.id);
    const newOrder = [...userOrder];

    // Remove dragged item
    newOrder.splice(draggedIndex, 1);

    // Insert at new position
    newOrder.splice(dropIndex, 0, draggedItem);

    setUserOrder(newOrder);
    setDraggedItem(null);
  };

  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const newOrder = [...userOrder];
    [newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]];
    setUserOrder(newOrder);
  };

  const handleMoveDown = (index: number) => {
    if (index === userOrder.length - 1) return;
    const newOrder = [...userOrder];
    [newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]];
    setUserOrder(newOrder);
  };

  const handleCheckAnswer = () => {
    const correct = userOrder.every((item, index) => item.order === index + 1);
    setIsCorrect(correct);
    setShowResults(true);
  };

  const handleReset = () => {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    setShuffledItems(shuffled);
    setUserOrder(shuffled);
    setShowResults(false);
    setIsCorrect(false);
  };

  if (showResults) {
    return (
      <div className="space-y-6">
        <Card className={`border-2 ${isCorrect ? 'border-green-500' : 'border-amber-500'}`}>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto ${
                isCorrect ? 'bg-green-100 dark:bg-green-950' : 'bg-amber-100 dark:bg-amber-950'
              }`}>
                {isCorrect ? (
                  <Trophy className="h-10 w-10 text-green-600" />
                ) : (
                  <AlertCircle className="h-10 w-10 text-amber-600" />
                )}
              </div>

              <div>
                <h3 className="text-2xl font-bold mb-2">
                  {isCorrect ? "Perfect! 🎉" : "Not Quite Right"}
                </h3>
                <p className="text-muted-foreground">
                  {isCorrect
                    ? "You've mastered the sales cycle! You understand the complete customer journey from initial contact to project completion."
                    : "Review the correct order below and try again to reinforce your understanding."}
                </p>
              </div>

              <Button onClick={handleReset} className="bg-amber-500 hover:bg-amber-600">
                <RotateCcw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Show correct order */}
        <div className="space-y-4">
          <h4 className="font-semibold text-lg flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Correct Sales Cycle Order
          </h4>

          <div className="space-y-3">
            {[...items].sort((a, b) => a.order - b.order).map((item, index) => {
              const userItem = userOrder[index];
              const isCorrectPosition = userItem.id === item.id;

              return (
                <Card
                  key={item.id}
                  className={`${
                    isCorrectPosition
                      ? 'border-green-500 bg-green-50 dark:bg-green-950'
                      : 'border-red-300 bg-red-50 dark:bg-red-950'
                  }`}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-white ${
                        isCorrectPosition ? 'bg-green-600' : 'bg-red-600'
                      }`}>
                        {item.order}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{item.phase}</h4>
                        <p className="text-sm text-muted-foreground">{item.description}</p>
                        {!isCorrectPosition && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-2">
                            You placed this at position {index + 1} (should be {item.order})
                          </p>
                        )}
                      </div>
                      {isCorrectPosition ? (
                        <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-blue-900 dark:text-blue-100">
            <strong>Instructions:</strong> Arrange the sales cycle phases in the correct order
            from initial contact to project completion. Drag items to reorder them, or use the
            arrow buttons on mobile.
          </p>
        </CardContent>
      </Card>

      {/* Sortable List */}
      <div className="space-y-3">
        {userOrder.map((item, index) => (
          <Card
            key={item.id}
            draggable
            onDragStart={() => handleDragStart(item)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(index)}
            className="cursor-move hover:shadow-md transition-shadow border-2 border-transparent hover:border-amber-200 dark:hover:border-amber-900"
          >
            <CardContent className="pt-4 pb-4">
              <div className="flex items-start gap-3">
                {/* Drag Handle */}
                <div className="shrink-0 mt-1">
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Position Badge */}
                <Badge variant="outline" className="shrink-0">
                  #{index + 1}
                </Badge>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold mb-1">{item.phase}</h4>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>

                {/* Mobile Controls */}
                <div className="flex flex-col gap-1 shrink-0 sm:hidden">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveUp(index)}
                    disabled={index === 0}
                    className="h-6 px-2"
                  >
                    ↑
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleMoveDown(index)}
                    disabled={index === userOrder.length - 1}
                    className="h-6 px-2"
                  >
                    ↓
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Actions */}
      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={handleReset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Shuffle Again
        </Button>

        <Button onClick={handleCheckAnswer} className="bg-amber-500 hover:bg-amber-600">
          <CheckCircle className="mr-2 h-4 w-4" />
          Check My Answer
        </Button>
      </div>

      {/* Tips */}
      <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-800">
        <CardContent className="pt-4 pb-4">
          <p className="text-sm text-amber-900 dark:text-amber-100">
            <strong>Tip:</strong> Think about the logical flow of the customer experience.
            What happens first when you meet a homeowner? What needs to happen before you
            can install a roof? Understanding this sequence helps you guide customers smoothly
            through the entire process.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

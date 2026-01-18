import { Flame, Calendar } from "lucide-react";

interface StreakCounterProps {
  currentStreak: number;
  longestStreak: number;
  className?: string;
}

export function StreakCounter({
  currentStreak,
  longestStreak,
  className = ""
}: StreakCounterProps) {
  const getStreakColor = (streak: number) => {
    if (streak >= 30) return "text-purple-400";
    if (streak >= 14) return "text-red-400";
    if (streak >= 7) return "text-orange-400";
    if (streak >= 3) return "text-yellow-400";
    return "text-gray-400";
  };

  const getStreakMessage = (streak: number) => {
    if (streak === 0) return "Start your streak today!";
    if (streak === 1) return "Great start! Keep it going.";
    if (streak < 7) return "You're on fire!";
    if (streak < 14) return "Impressive dedication!";
    if (streak < 30) return "You're unstoppable!";
    return "Legendary commitment!";
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Flame className={`w-8 h-8 ${getStreakColor(currentStreak)}`} />
          <div>
            <div className="flex items-baseline space-x-2">
              <span className={`text-4xl font-bold ${getStreakColor(currentStreak)}`}>
                {currentStreak}
              </span>
              <span className="text-sm text-muted-foreground">day{currentStreak !== 1 ? 's' : ''}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getStreakMessage(currentStreak)}
            </p>
          </div>
        </div>

        {longestStreak > currentStreak && (
          <div className="text-right">
            <div className="flex items-center space-x-1 text-muted-foreground">
              <Calendar className="w-3 h-3" />
              <span className="text-xs">Best:</span>
            </div>
            <span className="text-lg font-bold text-muted-foreground">
              {longestStreak}
            </span>
          </div>
        )}
      </div>

      {/* Streak Milestones */}
      <div className="flex items-center space-x-2">
        {[3, 7, 14, 30, 100].map((milestone) => (
          <div
            key={milestone}
            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
              currentStreak >= milestone
                ? 'bg-gradient-to-r from-orange-500 to-red-500'
                : 'bg-muted'
            }`}
            title={`${milestone} day milestone`}
          />
        ))}
      </div>

      <div className="flex justify-between text-xs text-muted-foreground">
        <span>3d</span>
        <span>7d</span>
        <span>14d</span>
        <span>30d</span>
        <span>100d</span>
      </div>
    </div>
  );
}

import { cn } from "@/lib/utils";

interface DualColorProgressBarProps {
  current: number;
  goal: number;
  pace: number;
  height?: string;
  isRevenue?: boolean;
}

export function DualColorProgressBar({
  current,
  goal,
  pace,
  height = "h-2",
  isRevenue = false
}: DualColorProgressBarProps) {
  const currentPercentage = Math.min((current / goal) * 100, 100);
  const pacePercentage = Math.min((pace / goal) * 100, 100);

  // Determine colors based on whether current is ahead or behind pace
  const isAheadOfPace = current >= pace;
  const hasMetGoal = current >= goal;

  // Color logic:
  // - Green: Met goal (100%)
  // - Yellow: Ahead of pace but not at goal
  // - Red: Behind pace
  const getProgressColor = () => {
    if (hasMetGoal) return 'bg-green-500';
    if (isAheadOfPace) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className={cn("w-full bg-muted rounded-full overflow-hidden relative", height)}>
      {/* Pace indicator (lighter background) */}
      <div
        className="absolute top-0 left-0 h-full bg-muted-foreground/20 transition-all duration-500"
        style={{ width: `${pacePercentage}%` }}
      />

      {/* Current progress (colored) */}
      <div
        className={cn(
          "absolute top-0 left-0 h-full transition-all duration-500",
          getProgressColor()
        )}
        style={{ width: `${currentPercentage}%` }}
      />
    </div>
  );
}

import { Star } from "lucide-react";

interface XPBarProps {
  currentXP: number;
  currentLevel: number;
  xpForNextLevel: number;
  xpForCurrentLevel: number;
  className?: string;
}

export function XPBar({
  currentXP,
  currentLevel,
  xpForNextLevel,
  xpForCurrentLevel,
  className = ""
}: XPBarProps) {
  // Calculate XP within current level
  const xpInCurrentLevel = currentXP - xpForCurrentLevel;
  const xpNeededForLevel = xpForNextLevel - xpForCurrentLevel;
  const progressPercentage = Math.min(100, Math.round((xpInCurrentLevel / xpNeededForLevel) * 100));

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          <span className="text-sm font-medium">Level {currentLevel}</span>
        </div>
        <span className="text-xs text-muted-foreground">
          {currentXP} / {xpForNextLevel} XP
        </span>
      </div>

      <div className="relative h-3 bg-muted rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-red-600 via-red-500 to-amber-500 transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
        </div>

        {/* Level indicator */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-white drop-shadow-md mix-blend-difference">
            {progressPercentage}%
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>{xpNeededForLevel - xpInCurrentLevel} XP to Level {currentLevel + 1}</span>
        <span className="text-amber-500 font-medium">+{xpInCurrentLevel} XP</span>
      </div>
    </div>
  );
}

// Add shimmer animation to your global CSS or tailwind config
// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }
// .animate-shimmer {
//   animation: shimmer 2s infinite;
// }

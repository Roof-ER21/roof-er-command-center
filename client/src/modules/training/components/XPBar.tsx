import { useEffect, useState } from 'react';
import { formatXP, calculateProgress, getLevelTitle } from '../../../lib/gamification';

interface XPBarProps {
  totalXP: number;
  animated?: boolean;
  showDetails?: boolean;
}

export function XPBar({ totalXP, animated = true, showDetails = true }: XPBarProps) {
  const [displayXP, setDisplayXP] = useState(animated ? 0 : totalXP);
  const progress = calculateProgress(totalXP);
  const percentage = Math.min(100, Math.round(((totalXP - progress.xpForCurrentLevel) / (progress.xpToNextLevel + (totalXP - progress.xpForCurrentLevel))) * 100));

  // Animate XP count on mount
  useEffect(() => {
    if (!animated) return;

    const duration = 1500;
    const steps = 60;
    const stepValue = totalXP / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      setDisplayXP(Math.min(totalXP, Math.round(stepValue * currentStep)));

      if (currentStep >= steps) {
        clearInterval(interval);
        setDisplayXP(totalXP);
      }
    }, duration / steps);

    return () => clearInterval(interval);
  }, [totalXP, animated]);

  return (
    <div className="space-y-2">
      {/* Level & XP Display */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-gray-700">Level</span>
            <span className="text-2xl font-bold text-amber-600">{progress.currentLevel}</span>
          </div>
          <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">
            {getLevelTitle(progress.currentLevel)}
          </span>
        </div>
        <div className="text-right">
          <div className="text-sm font-semibold text-gray-900">
            {formatXP(displayXP)} XP
          </div>
          {showDetails && (
            <div className="text-xs text-gray-500">
              {formatXP(progress.xpToNextLevel)} to next level
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative">
        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          >
            <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Percentage Label */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xs font-bold text-gray-700 drop-shadow-sm">
            {percentage}%
          </span>
        </div>
      </div>

      {/* Next Level Preview */}
      {showDetails && progress.currentLevel < 50 && (
        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Level {progress.currentLevel}</span>
          <span className="text-gray-400">Level {progress.currentLevel + 1}</span>
        </div>
      )}
    </div>
  );
}

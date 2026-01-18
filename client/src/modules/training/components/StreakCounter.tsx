import { Flame, Snowflake } from 'lucide-react';

interface StreakCounterProps {
  currentStreak: number;
  longestStreak?: number;
  hasFreezeAvailable?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StreakCounter({
  currentStreak,
  longestStreak,
  hasFreezeAvailable = false,
  size = 'md'
}: StreakCounterProps) {
  const isActive = currentStreak > 0;

  const sizeClasses = {
    sm: {
      container: 'px-3 py-2',
      icon: 'w-4 h-4',
      number: 'text-lg',
      label: 'text-xs',
    },
    md: {
      container: 'px-4 py-3',
      icon: 'w-5 h-5',
      number: 'text-2xl',
      label: 'text-sm',
    },
    lg: {
      container: 'px-6 py-4',
      icon: 'w-6 h-6',
      number: 'text-3xl',
      label: 'text-base',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className="space-y-2">
      {/* Main Streak Display */}
      <div
        className={`
          ${classes.container}
          rounded-lg border-2
          ${isActive
            ? 'bg-gradient-to-br from-orange-50 to-red-50 border-orange-400'
            : 'bg-gray-50 border-gray-300'
          }
          flex items-center gap-3
        `}
      >
        {/* Fire Icon with Animation */}
        <div className="relative">
          <Flame
            className={`
              ${classes.icon}
              ${isActive ? 'text-orange-500' : 'text-gray-400'}
              ${isActive && currentStreak >= 3 ? 'animate-pulse' : ''}
            `}
            fill={isActive ? 'currentColor' : 'none'}
          />
          {isActive && currentStreak >= 7 && (
            <div className="absolute -top-1 -right-1">
              <div className="w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
              <div className="w-2 h-2 bg-yellow-500 rounded-full absolute top-0 left-0" />
            </div>
          )}
        </div>

        {/* Streak Count */}
        <div className="flex-1">
          <div className="flex items-baseline gap-1">
            <span className={`${classes.number} font-bold ${isActive ? 'text-orange-600' : 'text-gray-500'}`}>
              {currentStreak}
            </span>
            <span className={`${classes.label} text-gray-600 font-medium`}>
              day{currentStreak !== 1 ? 's' : ''}
            </span>
          </div>
          <div className={`${classes.label} text-gray-500`}>
            Current Streak
          </div>
        </div>

        {/* Freeze Indicator */}
        {hasFreezeAvailable && (
          <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-md">
            <Snowflake className="w-3 h-3 text-blue-500" />
            <span className="text-xs font-semibold text-blue-600">Freeze</span>
          </div>
        )}
      </div>

      {/* Longest Streak */}
      {longestStreak !== undefined && longestStreak > currentStreak && (
        <div className="flex items-center justify-between px-2 text-xs text-gray-600">
          <span>Longest streak: {longestStreak} days</span>
          {currentStreak > 0 && (
            <span className="text-orange-600 font-medium">
              {longestStreak - currentStreak} to beat!
            </span>
          )}
        </div>
      )}

      {/* Streak Milestones */}
      {isActive && (
        <div className="flex gap-1">
          {[3, 7, 14, 30].map((milestone) => (
            <div
              key={milestone}
              className={`
                flex-1 h-1.5 rounded-full
                ${currentStreak >= milestone
                  ? 'bg-gradient-to-r from-orange-400 to-red-400'
                  : 'bg-gray-200'
                }
              `}
              title={`${milestone}-day milestone`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";

export interface ProgressRingProps {
  progress: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  backgroundColor?: string;
  showPercentage?: boolean;
  label?: string;
  className?: string;
}

export function ProgressRing({
  progress,
  size = 120,
  strokeWidth = 8,
  color = "hsl(var(--primary))",
  backgroundColor = "hsl(var(--muted))",
  showPercentage = true,
  label,
  className,
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  // Normalize progress to 0-100
  const normalizedProgress = Math.min(100, Math.max(0, progress));

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg
        width={size}
        height={size}
        className="transform -rotate-90"
      >
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={backgroundColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-in-out"
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && (
          <span className="text-2xl font-bold">
            {Math.round(normalizedProgress)}%
          </span>
        )}
        {label && (
          <span className="text-xs text-muted-foreground mt-1 text-center px-2">
            {label}
          </span>
        )}
      </div>
    </div>
  );
}

export interface MultiProgressRingProps {
  rings: {
    progress: number;
    color: string;
    label?: string;
  }[];
  size?: number;
  strokeWidth?: number;
  showPercentage?: boolean;
  centerLabel?: string;
  className?: string;
}

export function MultiProgressRing({
  rings,
  size = 120,
  strokeWidth = 6,
  showPercentage = false,
  centerLabel,
  className,
}: MultiProgressRingProps) {
  const spacing = strokeWidth + 2;

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {rings.map((ring, index) => {
          const currentRadius = (size - strokeWidth - index * spacing * 2) / 2;
          const circumference = currentRadius * 2 * Math.PI;
          const offset = circumference - (ring.progress / 100) * circumference;

          return (
            <g key={index}>
              {/* Background circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={currentRadius}
                stroke="hsl(var(--muted))"
                strokeWidth={strokeWidth}
                fill="none"
                opacity={0.3}
              />
              {/* Progress circle */}
              <circle
                cx={size / 2}
                cy={size / 2}
                r={currentRadius}
                stroke={ring.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-500 ease-in-out"
              />
            </g>
          );
        })}
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {showPercentage && rings.length === 1 && (
          <span className="text-2xl font-bold">
            {Math.round(rings[0].progress)}%
          </span>
        )}
        {centerLabel && (
          <span className="text-xs text-muted-foreground text-center px-2">
            {centerLabel}
          </span>
        )}
      </div>
    </div>
  );
}

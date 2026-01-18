import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    label: string;
  };
  variant?: "default" | "green" | "red" | "purple" | "amber" | "sky";
  onClick?: () => void;
  className?: string;
}

const variantStyles = {
  default: {
    icon: "text-muted-foreground",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
    },
  },
  green: {
    icon: "text-green-600",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
    },
  },
  red: {
    icon: "text-red-600",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
    },
  },
  purple: {
    icon: "text-purple-600",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
    },
  },
  amber: {
    icon: "text-amber-600",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
    },
  },
  sky: {
    icon: "text-sky-600",
    trend: {
      up: "text-green-600",
      down: "text-red-600",
    },
  },
};

export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  variant = "default",
  onClick,
  className,
}: StatsCardProps) {
  const styles = variantStyles[variant];
  const isPositiveTrend = trend && trend.value >= 0;
  const TrendIcon = isPositiveTrend ? TrendingUp : TrendingDown;

  return (
    <Card
      className={cn(
        "transition-all duration-200",
        onClick && "cursor-pointer hover:shadow-md hover:scale-[1.02]",
        className
      )}
      onClick={onClick}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn("h-4 w-4", styles.icon)} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <div
            className={cn(
              "flex items-center space-x-1 text-xs font-medium mt-1",
              isPositiveTrend ? styles.trend.up : styles.trend.down
            )}
          >
            <TrendIcon className="h-3 w-3" />
            <span>
              {isPositiveTrend ? "+" : ""}
              {trend.value}%
            </span>
            <span className="text-muted-foreground">{trend.label}</span>
          </div>
        )}
        {description && !trend && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
}

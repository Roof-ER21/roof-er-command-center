import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

export interface ActivityItem {
  id: string;
  user: {
    name: string;
    avatar?: string;
    initials?: string;
  };
  action: string;
  module?: "hr" | "leaderboard" | "training" | "field";
  timestamp: Date | string;
  metadata?: {
    icon?: React.ReactNode;
    badge?: string;
    badgeVariant?: "default" | "secondary" | "destructive" | "outline";
  };
}

export interface RecentActivityFeedProps {
  title?: string;
  activities: ActivityItem[];
  maxItems?: number;
  moduleFilter?: "hr" | "leaderboard" | "training" | "field";
  showModuleBadges?: boolean;
  className?: string;
  onActivityClick?: (activity: ActivityItem) => void;
}

const moduleColors = {
  hr: "bg-purple-500/10 text-purple-600 border-purple-500/20",
  leaderboard: "bg-green-500/10 text-green-600 border-green-500/20",
  training: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  field: "bg-sky-500/10 text-sky-600 border-sky-500/20",
};

const moduleLabels = {
  hr: "HR",
  leaderboard: "Leaderboard",
  training: "Training",
  field: "Field",
};

export function RecentActivityFeed({
  title = "Recent Activity",
  activities,
  maxItems = 10,
  moduleFilter,
  showModuleBadges = true,
  className,
  onActivityClick,
}: RecentActivityFeedProps) {
  const filteredActivities = moduleFilter
    ? activities.filter((a) => a.module === moduleFilter)
    : activities;

  const displayActivities = filteredActivities.slice(0, maxItems);

  const formatTime = (timestamp: Date | string) => {
    const date = typeof timestamp === "string" ? new Date(timestamp) : timestamp;
    return formatDistanceToNow(date, { addSuffix: true });
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-[400px] overflow-y-auto">
          {displayActivities.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              No recent activity
            </p>
          ) : (
            displayActivities.map((activity) => (
              <div
                key={activity.id}
                className={cn(
                  "flex items-start gap-3 pb-3 border-b last:border-0",
                  onActivityClick && "cursor-pointer hover:bg-accent/50 -mx-2 px-2 rounded-lg transition-colors"
                )}
                onClick={() => onActivityClick?.(activity)}
              >
                <Avatar className="h-8 w-8 mt-1">
                  <AvatarImage src={activity.user.avatar} />
                  <AvatarFallback className="text-xs">
                    {activity.user.initials ||
                      activity.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-medium">{activity.user.name}</span>{" "}
                        <span className="text-muted-foreground">{activity.action}</span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <p className="text-xs text-muted-foreground">
                          {formatTime(activity.timestamp)}
                        </p>
                        {showModuleBadges && activity.module && (
                          <Badge
                            variant="outline"
                            className={cn("text-xs", moduleColors[activity.module])}
                          >
                            {moduleLabels[activity.module]}
                          </Badge>
                        )}
                        {activity.metadata?.badge && (
                          <Badge
                            variant={activity.metadata.badgeVariant || "secondary"}
                            className="text-xs"
                          >
                            {activity.metadata.badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                    {activity.metadata?.icon && (
                      <div className="text-muted-foreground">
                        {activity.metadata.icon}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trophy, Medal, Award, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface LeaderboardEntry {
  id: string;
  rank: number;
  user: {
    id?: string;
    name: string;
    avatar?: string;
    initials?: string;
  };
  score: number;
  scoreLabel?: string;
  change?: number; // Position change from last period
}

export interface LeaderboardMiniProps {
  title?: string;
  entries: LeaderboardEntry[];
  currentUserId?: string;
  currentUserRank?: number;
  maxEntries?: number;
  showChange?: boolean;
  onViewFull?: () => void;
  viewFullLabel?: string;
  className?: string;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <Trophy className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-slate-400" />;
    case 3:
      return <Award className="h-5 w-5 text-amber-700" />;
    default:
      return null;
  }
};

const getRankColor = (rank: number) => {
  switch (rank) {
    case 1:
      return "text-yellow-500 font-bold";
    case 2:
      return "text-slate-400 font-bold";
    case 3:
      return "text-amber-700 font-bold";
    default:
      return "text-muted-foreground";
  }
};

export function LeaderboardMini({
  title = "Top Performers",
  entries,
  currentUserId,
  currentUserRank,
  maxEntries = 5,
  showChange = true,
  onViewFull,
  viewFullLabel = "View Full Leaderboard",
  className,
}: LeaderboardMiniProps) {
  const topEntries = entries.slice(0, maxEntries);
  const currentUserEntry = currentUserId
    ? entries.find((e) => e.user.id === currentUserId)
    : undefined;

  const showCurrentUser =
    currentUserEntry &&
    currentUserRank &&
    currentUserRank > maxEntries &&
    !topEntries.some((e) => e.user.id === currentUserId);

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg">{title}</CardTitle>
        {onViewFull && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onViewFull}
            className="h-auto p-0 text-xs"
          >
            {viewFullLabel}
            <ChevronRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topEntries.map((entry) => {
            const isCurrentUser = entry.user.id === currentUserId;
            return (
              <div
                key={entry.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg transition-colors",
                  isCurrentUser && "bg-primary/5 border border-primary/20"
                )}
              >
                <div className="flex items-center justify-center w-8">
                  {getRankIcon(entry.rank) || (
                    <span className={cn("text-sm font-semibold", getRankColor(entry.rank))}>
                      #{entry.rank}
                    </span>
                  )}
                </div>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={entry.user.avatar} />
                  <AvatarFallback className="text-xs">
                    {entry.user.initials ||
                      entry.user.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .toUpperCase()
                        .slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className={cn("text-sm font-medium truncate", isCurrentUser && "font-bold")}>
                    {entry.user.name}
                    {isCurrentUser && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        You
                      </Badge>
                    )}
                  </p>
                  {entry.scoreLabel && (
                    <p className="text-xs text-muted-foreground">{entry.scoreLabel}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">{entry.score.toLocaleString()}</span>
                  {showChange && entry.change !== undefined && entry.change !== 0 && (
                    <Badge
                      variant={entry.change > 0 ? "default" : "secondary"}
                      className={cn(
                        "text-xs",
                        entry.change > 0 ? "bg-green-500/10 text-green-600" : "bg-red-500/10 text-red-600"
                      )}
                    >
                      {entry.change > 0 ? "+" : ""}
                      {entry.change}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}

          {showCurrentUser && currentUserEntry && (
            <>
              <div className="border-t pt-3">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-center w-8">
                    <span className="text-sm font-semibold text-muted-foreground">
                      #{currentUserRank}
                    </span>
                  </div>
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={currentUserEntry.user.avatar} />
                    <AvatarFallback className="text-xs">
                      {currentUserEntry.user.initials ||
                        currentUserEntry.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()
                          .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">
                      {currentUserEntry.user.name}
                      <Badge variant="outline" className="ml-2 text-xs">
                        You
                      </Badge>
                    </p>
                    {currentUserEntry.scoreLabel && (
                      <p className="text-xs text-muted-foreground">
                        {currentUserEntry.scoreLabel}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">
                      {currentUserEntry.score.toLocaleString()}
                    </span>
                    {showChange && currentUserEntry.change !== undefined && currentUserEntry.change !== 0 && (
                      <Badge
                        variant={currentUserEntry.change > 0 ? "default" : "secondary"}
                        className={cn(
                          "text-xs",
                          currentUserEntry.change > 0
                            ? "bg-green-500/10 text-green-600"
                            : "bg-red-500/10 text-red-600"
                        )}
                      >
                        {currentUserEntry.change > 0 ? "+" : ""}
                        {currentUserEntry.change}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

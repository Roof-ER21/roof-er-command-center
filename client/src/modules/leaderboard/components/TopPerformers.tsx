import { Trophy, Star } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import type { SalesRep } from "@/shared/schema";

interface RankChange {
  id: number;
  previousRank: number;
  currentRank: number;
  direction: 'up' | 'down' | 'same';
}

interface TopPerformersProps {
  performers: SalesRep[];
  rankChanges?: RankChange[];
  showRankAnimation?: boolean;
  sortBy?: string;
}

const formatCurrency = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

const getRankColor = (rank: number): string => {
  switch (rank) {
    case 1:
      return 'from-yellow-500 to-yellow-600';
    case 2:
      return 'from-gray-400 to-gray-500';
    case 3:
      return 'from-amber-600 to-amber-700';
    default:
      return 'from-muted to-muted-foreground';
  }
};

export function TopPerformers({
  performers,
  rankChanges = [],
  showRankAnimation = false,
  sortBy = "monthlySignups"
}: TopPerformersProps) {
  // Helper function to get display info based on sort type
  const getMetricDisplay = (sortBy: string, performer: SalesRep) => {
    switch (sortBy) {
      case 'monthlySignups':
        return {
          label: 'Monthly Signups',
          value: performer.monthlySignups,
          isNumeric: true
        };
      case 'yearlySignups':
        return {
          label: 'Yearly Signups',
          value: performer.yearlySignups,
          isNumeric: true
        };
      case 'yearlyRevenue':
        return {
          label: 'Yearly Revenue',
          value: formatCurrency(performer.yearlyRevenue),
          isNumeric: false
        };
      case 'allTimeRevenue':
        return {
          label: 'All-Time Revenue',
          value: formatCurrency(performer.allTimeRevenue),
          isNumeric: false
        };
      default:
        return {
          label: 'Monthly Signups',
          value: performer.monthlySignups,
          isNumeric: true
        };
    }
  };

  // Get title based on sort type
  const getTitle = (sortBy: string) => {
    switch (sortBy) {
      case 'yearlySignups':
        return 'Top Performers This Year';
      case 'yearlyRevenue':
        return 'Top Revenue Leaders This Year';
      case 'allTimeRevenue':
        return 'All-Time Revenue Leaders';
      default:
        return 'Top Performers This Month';
    }
  };

  if (performers.length === 0) {
    return (
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
          <Trophy className="w-6 h-6 text-primary" />
          {getTitle(sortBy)}
        </h2>
        <div className="text-center py-12 text-muted-foreground">
          <p>No performance data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-12">
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-3">
        <Trophy className="w-6 h-6 text-primary" />
        {getTitle(sortBy)}
      </h2>
      <div className="grid md:grid-cols-3 gap-6">
        {performers.map((performer, index) => {
          const rank = index + 1;
          const isFirst = rank === 1;
          const rankChange = rankChanges.find(change => change.id === performer.id);
          const hasRankChange = rankChange && showRankAnimation;
          const goalProgress = parseFloat(performer.goalProgress);

          return (
            <Card
              key={performer.id}
              className={`relative transition-all duration-500 ${
                hasRankChange
                  ? 'animate-pulse border-primary/50'
                  : isFirst
                  ? 'border-primary/30'
                  : 'hover:border-primary/50'
              }`}
            >
              <div className={`absolute -top-3 -right-3 w-12 h-12 bg-gradient-to-br ${getRankColor(rank)} rounded-full flex items-center justify-center shadow-lg ${
                hasRankChange ? 'animate-bounce' : ''
              }`}>
                <span className="text-white font-black text-lg">{rank}</span>
                {hasRankChange && rankChange && (
                  <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                    rankChange.direction === 'up'
                      ? 'bg-green-500 text-white'
                      : 'bg-red-500 text-white'
                  }`}>
                    {rankChange.direction === 'up' ? '↑' : '↓'}
                  </div>
                )}
              </div>

              <div className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-16 h-16 border-2" style={{
                    borderColor: isFirst ? 'hsl(var(--primary))' : rank === 2 ? '#9CA3AF' : '#D97706'
                  }}>
                    <AvatarImage
                      src={performer.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(performer.name)}&background=dc2626&color=fff`}
                      alt={performer.name}
                    />
                    <AvatarFallback>
                      {performer.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-bold truncate">{performer.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {performer.title}
                    </p>
                    {isFirst && (
                      <Badge variant="default" className="mt-1">
                        <Star className="w-3 h-3 mr-1" />
                        Top Performer
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{getMetricDisplay(sortBy, performer).label}</span>
                    <span className="text-2xl font-bold text-primary">
                      {getMetricDisplay(sortBy, performer).value}
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-muted-foreground mb-1">
                      <span>Progress to Goal</span>
                      <span>{Math.round(goalProgress)}%</span>
                    </div>
                    <Progress
                      value={Math.min(goalProgress, 100)}
                      className="h-2"
                    />
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { useState, useEffect, forwardRef } from 'react';
import { TableCell, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { DualColorProgressBar } from '@/components/DualColorProgressBar';
import type { SalesRep } from '@shared/schema';

interface AnimatedRankRowProps {
  salesRep: SalesRep;
  currentRank: number;
  previousRank?: number;
  isRankChanging: boolean;
  onRankChangeComplete: () => void;
  onClick?: (salesRep: SalesRep) => void;
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

const formatNumber = (value: string | number): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-US').format(num);
};

const bonusTiers = {
  1: { emoji: '🪙', name: 'Bronze', requirement: 15 },
  2: { emoji: '💰', name: 'Silver', requirement: 20 },
  3: { emoji: '💎', name: 'Gold', requirement: 25 },
  4: { emoji: '🏆', name: 'Platinum', requirement: 30 },
  5: { emoji: '👑', name: 'Diamond', requirement: 35 },
  6: { emoji: '💯', name: 'Elite', requirement: 40 }
};

export const AnimatedRankRow = forwardRef<HTMLTableRowElement, AnimatedRankRowProps>(
  function AnimatedRankRow({
    salesRep,
    currentRank,
    previousRank,
    isRankChanging,
    onRankChangeComplete,
    onClick
  }, ref) {
    const [showRankChange, setShowRankChange] = useState(false);
    const [rankDirection, setRankDirection] = useState<'up' | 'down' | null>(null);

    useEffect(() => {
      if (isRankChanging && previousRank && previousRank !== currentRank) {
        setRankDirection(currentRank < previousRank ? 'up' : 'down');
        setShowRankChange(true);

        const timer = setTimeout(() => {
          setShowRankChange(false);
          setRankDirection(null);
          onRankChangeComplete();
        }, 3000);

        return () => clearTimeout(timer);
      }
    }, [isRankChanging, currentRank, previousRank, onRankChangeComplete]);

    const isTop3 = currentRank <= 3;
    const monthlySignups = parseFloat(salesRep.monthlySignups);
    const yearlySignups = parseFloat(salesRep.yearlySignups);
    const yearlyRevenue = parseFloat(salesRep.yearlyRevenue);
    const allTimeRevenue = parseFloat(salesRep.allTimeRevenue);
    const monthlyGrowth = parseFloat(salesRep.monthlyGrowth);
    const yearlyGrowth = parseFloat(salesRep.yearlyGrowth || '0');

    // Get goals from database
    const monthlySignupGoal = parseFloat(salesRep.monthlySignupGoal || '20');
    const yearlySignupGoal = monthlySignupGoal * 12;

    // Calculate yearly revenue goal
    const yearlyRevenueGoal = parseFloat(salesRep.yearlyRevenueGoal || '120000');

    // Calculate progress percentages
    const monthlySignupProgress = (monthlySignups / monthlySignupGoal) * 100;
    const yearlySignupProgress = (yearlySignups / yearlySignupGoal) * 100;
    const yearlyRevenueProgress = (yearlyRevenue / yearlyRevenueGoal) * 100;

    // Calculate pacing for current date
    const currentDayOfMonth = new Date().getDate();
    const currentMonth = new Date().getMonth() + 1;
    const monthlyPace = monthlySignupGoal * (currentDayOfMonth / 30);
    const yearlyPace = yearlySignupGoal * (currentMonth / 12);
    const revenuePace = yearlyRevenueGoal * (currentMonth / 12);

    // Status indicator
    const getStatusIcon = (current: number, pace: number, goal: number) => {
      const goalPercentage = (current / goal) * 100;
      if (goalPercentage >= 100) {
        return <span className="text-xs font-medium text-green-500">✓</span>;
      } else if (current >= pace) {
        return <span className="text-xs font-medium text-yellow-500">→</span>;
      } else {
        return <span className="text-xs font-medium text-red-500">↓</span>;
      }
    };

    return (
      <TableRow
        ref={ref}
        onClick={() => onClick?.(salesRep)}
        className={`transition-all duration-300 ${
          showRankChange ? 'bg-primary/10' : ''
        } ${isTop3 ? 'bg-muted/50' : ''} ${onClick ? 'cursor-pointer hover:bg-muted/70' : ''}`}
      >
        <TableCell className="text-center font-bold relative">
          <div className="flex items-center justify-center gap-2">
            <span className={`text-lg ${
              currentRank === 1 ? 'text-yellow-500' :
              currentRank === 2 ? 'text-gray-400' :
              currentRank === 3 ? 'text-amber-600' : ''
            }`}>
              {currentRank}
            </span>

            {showRankChange && rankDirection && (
              <div className="absolute -right-2 -top-1 animate-in fade-in zoom-in duration-500">
                {rankDirection === 'up' ? (
                  <div className="flex items-center text-green-500">
                    <TrendingUp className="w-4 h-4" />
                    <span className="text-xs font-bold ml-1">
                      +{previousRank! - currentRank}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-red-500">
                    <TrendingDown className="w-4 h-4" />
                    <span className="text-xs font-bold ml-1">
                      -{currentRank - previousRank!}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </TableCell>

        <TableCell>
          <div className="flex items-center gap-3">
            <Avatar className={`w-10 h-10 ${isTop3 ? 'ring-2 ring-primary' : ''}`}>
              <AvatarImage
                src={salesRep.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(salesRep.name)}&background=dc2626&color=fff`}
                alt={salesRep.name}
              />
              <AvatarFallback>
                {salesRep.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <div className="font-semibold truncate">{salesRep.name}</div>
              <div className="text-sm text-muted-foreground truncate">{salesRep.team}</div>

              {/* Bonus tier badge */}
              {salesRep.currentBonusTier > 0 && salesRep.currentBonusTier <= 6 && (
                <div className="flex items-center gap-1 mt-1">
                  <Badge variant="secondary" className="text-xs">
                    {bonusTiers[salesRep.currentBonusTier as keyof typeof bonusTiers].emoji}
                    {bonusTiers[salesRep.currentBonusTier as keyof typeof bonusTiers].name}
                  </Badge>
                </div>
              )}
            </div>
          </div>
        </TableCell>

        <TableCell>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-muted-foreground">Monthly Signups</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{formatNumber(monthlySignups)}/{monthlySignupGoal}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DualColorProgressBar
                  current={monthlySignups}
                  goal={monthlySignupGoal}
                  pace={monthlyPace}
                  height="h-2"
                />
                {getStatusIcon(monthlySignups, monthlyPace, monthlySignupGoal)}
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-muted-foreground">Yearly Signups</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{formatNumber(yearlySignups)}/{yearlySignupGoal}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DualColorProgressBar
                  current={yearlySignups}
                  goal={yearlySignupGoal}
                  pace={yearlyPace}
                  height="h-2"
                />
                {getStatusIcon(yearlySignups, yearlyPace, yearlySignupGoal)}
              </div>
            </div>
          </div>
        </TableCell>

        <TableCell>
          <div className="space-y-2">
            <div>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-muted-foreground">{new Date().getFullYear()}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{formatCurrency(yearlyRevenue)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <DualColorProgressBar
                  current={yearlyRevenue}
                  goal={yearlyRevenueGoal}
                  pace={revenuePace}
                  height="h-2"
                  isRevenue={true}
                />
                {getStatusIcon(yearlyRevenue, revenuePace, yearlyRevenueGoal)}
              </div>
            </div>
            <div className="text-muted-foreground text-xs flex items-center gap-1">
              {yearlyGrowth >= 0 ? (
                <TrendingUp className="w-3 h-3 text-green-500" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-500" />
              )}
              <span className={yearlyGrowth >= 0 ? 'text-green-500' : 'text-red-500'}>
                {yearlyGrowth >= 0 ? '+' : ''}{yearlyGrowth.toFixed(1)}% YTD
              </span>
            </div>
          </div>
        </TableCell>

        <TableCell className="text-right">
          <div className="text-sm">
            <div className="font-extrabold text-[16px] text-primary">{formatCurrency(allTimeRevenue)}</div>
            <div className="text-muted-foreground text-xs">Career Total</div>
          </div>
        </TableCell>
      </TableRow>
    );
  }
);

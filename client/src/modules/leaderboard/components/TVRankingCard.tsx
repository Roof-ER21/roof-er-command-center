import { Trophy, Medal, Award, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TVRankingCardProps {
  rank: number;
  name: string;
  avatar?: string;
  revenue: number;
  trend?: 'up' | 'down' | 'same';
  trendValue?: number;
  isNewLeader?: boolean;
  onClick?: () => void;
}

export function TVRankingCard({
  rank,
  name,
  avatar,
  revenue,
  trend = 'same',
  trendValue = 0,
  isNewLeader = false,
  onClick
}: TVRankingCardProps) {
  const isTop3 = rank <= 3;

  const getRankIcon = () => {
    switch (rank) {
      case 1:
        return <Trophy className="h-16 w-16 text-yellow-400 drop-shadow-glow" />;
      case 2:
        return <Medal className="h-16 w-16 text-slate-300 drop-shadow-glow" />;
      case 3:
        return <Award className="h-16 w-16 text-amber-600 drop-shadow-glow" />;
      default:
        return <span className="text-6xl font-bold text-slate-400">#{rank}</span>;
    }
  };

  const getCardBackground = () => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/30 via-yellow-600/20 to-yellow-500/30 border-2 border-yellow-400/50 shadow-2xl shadow-yellow-400/20';
      case 2:
        return 'bg-gradient-to-r from-slate-400/25 via-slate-500/15 to-slate-400/25 border-2 border-slate-400/40 shadow-xl shadow-slate-400/10';
      case 3:
        return 'bg-gradient-to-r from-amber-700/25 via-amber-800/15 to-amber-700/25 border-2 border-amber-700/40 shadow-xl shadow-amber-700/10';
      default:
        return 'bg-slate-800/60 border border-slate-700/50 shadow-lg';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-8 w-8 text-green-400" />;
      case 'down':
        return <TrendingDown className="h-8 w-8 text-red-400" />;
      default:
        return <Minus className="h-8 w-8 text-slate-400" />;
    }
  };

  const animationClass = isNewLeader
    ? 'animate-[celebration_2s_ease-in-out_infinite]'
    : isTop3
    ? 'animate-[pulse_3s_ease-in-out_infinite]'
    : '';

  return (
    <div
      onClick={onClick}
      className={`
        flex items-center gap-8 p-8 rounded-2xl transition-all duration-700
        ${getCardBackground()} ${animationClass}
        hover:scale-[1.02] hover:shadow-2xl
        ${onClick ? 'cursor-pointer active:scale-[0.98]' : ''}
      `}
    >
      {/* Rank Icon */}
      <div className="flex items-center justify-center w-24 h-24 shrink-0">
        {getRankIcon()}
      </div>

      {/* Avatar */}
      <Avatar className={`
        w-24 h-24 shrink-0 border-4
        ${rank === 1 ? 'border-yellow-400 shadow-lg shadow-yellow-400/50' :
          rank === 2 ? 'border-slate-300 shadow-lg shadow-slate-300/30' :
          rank === 3 ? 'border-amber-600 shadow-lg shadow-amber-600/30' :
          'border-slate-600'}
      `}>
        <AvatarImage
          src={avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=dc2626&color=fff&size=256`}
          alt={name}
        />
        <AvatarFallback className="text-2xl font-bold bg-primary text-primary-foreground">
          {name.split(' ').map(n => n[0]).join('')}
        </AvatarFallback>
      </Avatar>

      {/* Name & Details */}
      <div className="flex-1 min-w-0">
        <h3 className={`
          font-bold truncate leading-tight
          ${rank === 1 ? 'text-6xl text-yellow-400 drop-shadow-glow' :
            rank === 2 ? 'text-5xl text-slate-200' :
            rank === 3 ? 'text-5xl text-amber-500' :
            'text-4xl text-white'}
        `}>
          {name}
        </h3>
        {isNewLeader && (
          <p className="text-2xl text-yellow-300 mt-2 font-semibold animate-pulse">
            🎉 New Leader!
          </p>
        )}
      </div>

      {/* Revenue & Trend */}
      <div className="text-right shrink-0">
        <div className={`
          font-black tabular-nums
          ${rank === 1 ? 'text-7xl text-green-400 drop-shadow-glow' :
            rank === 2 ? 'text-6xl text-green-400' :
            rank === 3 ? 'text-6xl text-green-400' :
            'text-5xl text-green-400'}
        `}>
          ${revenue.toLocaleString()}
        </div>
        <div className="flex items-center justify-end gap-3 mt-3">
          {getTrendIcon()}
          <span className={`
            text-3xl font-bold
            ${trend === 'up' ? 'text-green-400' :
              trend === 'down' ? 'text-red-400' :
              'text-slate-400'}
          `}>
            {trend !== 'same' && (trendValue > 0 ? '+' : '')}{trendValue.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Crown for #1 */}
      {rank === 1 && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 text-8xl animate-bounce">
          👑
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Trophy, Clock, Award } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface ContestParticipant {
  rank: number;
  name: string;
  avatar?: string;
  score: number;
}

interface TVContestWidgetProps {
  title: string;
  description?: string;
  endDate: Date;
  prize?: string;
  topParticipants: ContestParticipant[];
}

export function TVContestWidget({
  title,
  description,
  endDate,
  prize,
  topParticipants
}: TVContestWidgetProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = endDate.getTime() - now;

      if (distance < 0) {
        setTimeLeft('Contest Ended');
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  return (
    <div className="bg-gradient-to-br from-purple-900/40 via-indigo-900/30 to-purple-900/40 border-2 border-purple-500/40 rounded-2xl p-8 shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-purple-500/20 rounded-xl flex items-center justify-center">
            <Trophy className="w-10 h-10 text-purple-400" />
          </div>
          <div>
            <h3 className="text-4xl font-bold text-white">{title}</h3>
            {description && (
              <p className="text-xl text-purple-200 mt-1">{description}</p>
            )}
          </div>
        </div>

        {/* Prize */}
        {prize && (
          <div className="flex items-center gap-3 bg-purple-500/20 px-6 py-3 rounded-xl">
            <Award className="w-8 h-8 text-yellow-400" />
            <span className="text-3xl font-bold text-yellow-400">{prize}</span>
          </div>
        )}
      </div>

      {/* Countdown Timer */}
      <div className="flex items-center justify-center gap-3 bg-purple-950/50 rounded-xl p-6 mb-6">
        <Clock className="w-10 h-10 text-purple-400 animate-pulse" />
        <div className="text-center">
          <div className="text-xl text-purple-300 font-semibold">Time Remaining</div>
          <div className="text-5xl font-black text-purple-100 tabular-nums mt-1 font-mono">
            {timeLeft}
          </div>
        </div>
      </div>

      {/* Top 3 Participants */}
      <div className="space-y-4">
        <h4 className="text-2xl font-bold text-purple-200 mb-4">Current Leaders</h4>
        {topParticipants.slice(0, 3).map((participant) => (
          <div
            key={participant.rank}
            className={`
              flex items-center gap-4 p-4 rounded-xl transition-all
              ${participant.rank === 1
                ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border border-yellow-400/30'
                : participant.rank === 2
                ? 'bg-gradient-to-r from-slate-400/20 to-slate-500/10 border border-slate-400/20'
                : 'bg-gradient-to-r from-amber-700/20 to-amber-800/10 border border-amber-700/20'
              }
            `}
          >
            {/* Rank */}
            <div className={`
              w-12 h-12 rounded-full flex items-center justify-center font-bold text-2xl
              ${participant.rank === 1 ? 'bg-yellow-500/30 text-yellow-300' :
                participant.rank === 2 ? 'bg-slate-400/30 text-slate-300' :
                'bg-amber-700/30 text-amber-300'}
            `}>
              {participant.rank}
            </div>

            {/* Avatar */}
            <Avatar className="w-12 h-12 border-2 border-purple-400/50">
              <AvatarImage
                src={participant.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(participant.name)}&background=dc2626&color=fff&size=128`}
                alt={participant.name}
              />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {participant.name.split(' ').map(n => n[0]).join('')}
              </AvatarFallback>
            </Avatar>

            {/* Name */}
            <div className="flex-1 text-2xl font-bold text-white truncate">
              {participant.name}
            </div>

            {/* Score */}
            <div className="text-3xl font-black text-green-400 tabular-nums">
              {participant.score.toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

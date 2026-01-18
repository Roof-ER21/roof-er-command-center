import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sparkles } from "lucide-react";

interface Achievement {
  id: string;
  userName: string;
  userAvatar?: string;
  achievementName: string;
  achievementIcon: string;
  timestamp: Date;
}

interface TVAchievementFeedProps {
  achievements: Achievement[];
}

export function TVAchievementFeed({ achievements }: TVAchievementFeedProps) {
  const [displayedAchievements, setDisplayedAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    // Show most recent achievements, up to 5
    const recent = [...achievements]
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 5);
    setDisplayedAchievements(recent);
  }, [achievements]);

  const formatTimeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  if (displayedAchievements.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-2xl p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h3 className="text-4xl font-bold text-white">Recent Achievements</h3>
        </div>
        <p className="text-2xl text-slate-400 text-center py-12">
          No recent achievements to display
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 border border-slate-700/50 rounded-2xl p-8 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 bg-primary/20 rounded-xl flex items-center justify-center">
          <Sparkles className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <h3 className="text-4xl font-bold text-white">Recent Achievements</h3>
      </div>

      {/* Scrolling Achievement List */}
      <div className="space-y-4 max-h-[600px] overflow-hidden">
        <div className="space-y-4 animate-[scroll_20s_linear_infinite]">
          {displayedAchievements.map((achievement) => (
            <div
              key={achievement.id}
              className="flex items-center gap-6 p-6 bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-xl hover:scale-[1.02] transition-transform duration-300"
            >
              {/* User Avatar */}
              <Avatar className="w-20 h-20 border-2 border-primary/50 shrink-0">
                <AvatarImage
                  src={achievement.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(achievement.userName)}&background=dc2626&color=fff&size=128`}
                  alt={achievement.userName}
                />
                <AvatarFallback className="bg-primary text-primary-foreground text-xl">
                  {achievement.userName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>

              {/* Achievement Icon */}
              <div className="text-6xl shrink-0 animate-bounce">
                {achievement.achievementIcon}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <div className="text-3xl font-bold text-white truncate">
                  {achievement.userName}
                </div>
                <div className="text-2xl text-slate-300 mt-1">
                  unlocked <span className="font-semibold text-primary">{achievement.achievementName}</span>
                </div>
              </div>

              {/* Timestamp */}
              <div className="text-xl text-slate-400 shrink-0 font-medium">
                {formatTimeAgo(achievement.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

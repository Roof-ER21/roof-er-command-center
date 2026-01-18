import { useEffect, useState } from "react";
import { Trophy, TrendingUp, Medal } from "lucide-react";

export function TVDisplayPage() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Sample data - will be replaced with real data
  const topSalesReps = [
    { rank: 1, name: "John Smith", sales: 125000, trend: "up" },
    { rank: 2, name: "Sarah Johnson", sales: 118000, trend: "up" },
    { rank: 3, name: "Mike Davis", sales: 105000, trend: "down" },
    { rank: 4, name: "Emily Brown", sales: 98000, trend: "up" },
    { rank: 5, name: "Chris Wilson", sales: 92000, trend: "same" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
            <span className="text-3xl font-bold">RE</span>
          </div>
          <div>
            <h1 className="text-4xl font-bold">Roof ER Sales</h1>
            <p className="text-slate-400 text-lg">Command Center Leaderboard</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-mono">
            {currentTime.toLocaleTimeString()}
          </div>
          <div className="text-slate-400">
            {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="space-y-4">
        {topSalesReps.map((rep, index) => (
          <div
            key={rep.rank}
            className={`flex items-center gap-6 p-6 rounded-xl transition-all ${
              index === 0
                ? 'bg-gradient-to-r from-yellow-500/20 to-yellow-600/10 border border-yellow-500/30'
                : index === 1
                ? 'bg-gradient-to-r from-slate-400/20 to-slate-500/10 border border-slate-400/30'
                : index === 2
                ? 'bg-gradient-to-r from-amber-700/20 to-amber-800/10 border border-amber-700/30'
                : 'bg-slate-800/50'
            }`}
          >
            {/* Rank */}
            <div className="flex items-center justify-center w-16 h-16">
              {index === 0 ? (
                <Trophy className="h-12 w-12 text-yellow-400" />
              ) : index === 1 ? (
                <Medal className="h-12 w-12 text-slate-300" />
              ) : index === 2 ? (
                <Medal className="h-12 w-12 text-amber-600" />
              ) : (
                <span className="text-4xl font-bold text-slate-400">#{rep.rank}</span>
              )}
            </div>

            {/* Name */}
            <div className="flex-1">
              <div className="text-3xl font-bold">{rep.name}</div>
            </div>

            {/* Sales */}
            <div className="text-right">
              <div className="text-4xl font-bold text-green-400">
                ${rep.sales.toLocaleString()}
              </div>
              <div className="flex items-center justify-end gap-1 text-sm">
                {rep.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-400" />}
                <span className="text-slate-400">This month</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-slate-500">
        <p>Updates every 30 seconds</p>
      </div>
    </div>
  );
}

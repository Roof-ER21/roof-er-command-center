import { useEffect, useState, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { TVRankingCard } from "../components/TVRankingCard";
import { TVContestWidget } from "../components/TVContestWidget";
import { TVAchievementFeed } from "../components/TVAchievementFeed";
import { RepDetailModal } from "../components/RepDetailModal";
import type { SalesRep, Contest } from "@shared/schema";

type ViewMode = 'rankings' | 'teams' | 'contests' | 'achievements';

interface TeamStanding {
  team: string;
  totalRevenue: number;
  memberCount: number;
  avgRevenue: number;
  trend: 'up' | 'down' | 'same';
}

export function TVDisplayPage() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('rankings');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [previousLeader, setPreviousLeader] = useState<string | null>(null);

  // Rep detail modal state
  const [selectedRepId, setSelectedRepId] = useState<number | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch sales reps data
  const { data: salesReps = [], refetch: refetchReps } = useQuery<SalesRep[]>({
    queryKey: ['/api/leaderboard/sales-reps'],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard/sales-reps');
      if (!response.ok) throw new Error('Failed to fetch sales reps');
      return response.json();
    },
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Fetch active contests
  const { data: contests = [], refetch: refetchContests } = useQuery<Contest[]>({
    queryKey: ['/api/leaderboard/contests/active'],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard/contests/active');
      if (!response.ok) throw new Error('Failed to fetch contests');
      return response.json();
    },
    refetchInterval: 30000,
  });

  // Fetch contest participants for the top active contest
  const topContest = contests.length > 0 ? contests[0] : null;
  const { data: contestParticipants = [] } = useQuery<Array<{
    id: number;
    contestId: number;
    salesRepId: number;
    score: number;
    rank: number;
    name: string;
    avatar: string | null;
    team: string;
  }>>({
    queryKey: ['/api/leaderboard/contests', topContest?.id, 'leaderboard'],
    queryFn: async () => {
      if (!topContest?.id) return [];
      const response = await fetch(`/api/leaderboard/contests/${topContest.id}/leaderboard`);
      if (!response.ok) throw new Error('Failed to fetch contest participants');
      return response.json();
    },
    enabled: !!topContest?.id,
    refetchInterval: 30000,
  });

  // Update current time
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-rotate views every 15 seconds
  useEffect(() => {
    const views: ViewMode[] = ['rankings', 'teams', 'contests', 'achievements'];
    let currentIndex = 0;

    const rotateView = () => {
      currentIndex = (currentIndex + 1) % views.length;
      setViewMode(views[currentIndex]);
    };

    const interval = setInterval(rotateView, 15000);
    return () => clearInterval(interval);
  }, []);

  // Check for new leader
  useEffect(() => {
    if (salesReps.length > 0) {
      const currentLeader = salesReps[0]?.name;
      if (previousLeader && currentLeader && previousLeader !== currentLeader) {
        // New leader detected! Trigger celebration
        playNewLeaderAnimation();
      }
      setPreviousLeader(currentLeader);
    }
  }, [salesReps]);

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'f':
          toggleFullscreen();
          break;
        case 'arrowright':
          rotateViewForward();
          break;
        case 'arrowleft':
          rotateViewBackward();
          break;
        case '1':
          setViewMode('rankings');
          break;
        case '2':
          setViewMode('teams');
          break;
        case '3':
          setViewMode('contests');
          break;
        case '4':
          setViewMode('achievements');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [viewMode]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const rotateViewForward = () => {
    const views: ViewMode[] = ['rankings', 'teams', 'contests', 'achievements'];
    const currentIndex = views.indexOf(viewMode);
    const nextIndex = (currentIndex + 1) % views.length;
    setViewMode(views[nextIndex]);
  };

  const rotateViewBackward = () => {
    const views: ViewMode[] = ['rankings', 'teams', 'contests', 'achievements'];
    const currentIndex = views.indexOf(viewMode);
    const prevIndex = (currentIndex - 1 + views.length) % views.length;
    setViewMode(views[prevIndex]);
  };

  const playNewLeaderAnimation = () => {
    // Create confetti or celebration effect
    console.log('🎉 New leader!');
  };

  // Handler for clicking on a rep
  const handleRepClick = useCallback((rep: SalesRep) => {
    setSelectedRepId(rep.id);
    setIsModalOpen(true);
  }, []);

  // Calculate team standings
  const teamStandings = calculateTeamStandings(salesReps);

  // Mock achievements (replace with real data)
  const mockAchievements = [
    {
      id: '1',
      userName: salesReps[0]?.name || 'John Doe',
      userAvatar: salesReps[0]?.avatar ?? undefined,
      achievementName: 'Sales Champion',
      achievementIcon: '🏆',
      timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 min ago
    },
    {
      id: '2',
      userName: salesReps[1]?.name || 'Jane Smith',
      userAvatar: salesReps[1]?.avatar ?? undefined,
      achievementName: 'Top Performer',
      achievementIcon: '⭐',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 min ago
    },
    {
      id: '3',
      userName: salesReps[2]?.name || 'Mike Johnson',
      userAvatar: salesReps[2]?.avatar ?? undefined,
      achievementName: 'Rising Star',
      achievementIcon: '🌟',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 min ago
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl animate-pulse delay-1000" />
      </div>

      <div className="relative z-10 p-8 md:p-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <div className="flex items-center gap-6">
            <img src="/logo.png" alt="Roof ER" className="w-20 h-20 md:w-24 md:h-24 rounded-2xl object-contain shadow-2xl shadow-primary/50" />
            <div>
              <h1 className="text-5xl md:text-7xl font-black bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                Roof ER Command Center
              </h1>
              <p className="text-xl md:text-3xl text-slate-400 mt-2 font-semibold">
                Sales Leaderboard {viewMode === 'rankings' && '- Top Performers'}
                {viewMode === 'teams' && '- Team Standings'}
                {viewMode === 'contests' && '- Active Contests'}
                {viewMode === 'achievements' && '- Recent Achievements'}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl md:text-6xl font-black tabular-nums text-white font-mono">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </div>
            <div className="text-xl md:text-2xl text-slate-400 mt-2 font-medium">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </div>
          </div>
        </div>

        {/* Main Content - View Rotation */}
        <div className="space-y-6 animate-fadeIn">
          {/* Rankings View */}
          {viewMode === 'rankings' && (
            <div className="space-y-6 relative">
              {salesReps.slice(0, 10).map((rep, index) => {
                const rank = index + 1;
                const isNewLeader = rank === 1 && !!previousLeader && previousLeader !== rep.name;

                return (
                  <TVRankingCard
                    key={rep.id}
                    rank={rank}
                    name={rep.name}
                    avatar={rep.avatar ?? undefined}
                    revenue={Number(rep.monthlyRevenue)}
                    trend={
                      Number(rep.monthlyGrowth) > 0 ? 'up' :
                      Number(rep.monthlyGrowth) < 0 ? 'down' : 'same'
                    }
                    trendValue={Number(rep.monthlyGrowth)}
                    isNewLeader={isNewLeader}
                    onClick={() => handleRepClick(rep)}
                  />
                );
              })}
            </div>
          )}

          {/* Team Standings View */}
          {viewMode === 'teams' && (
            <div className="space-y-6">
              {teamStandings.map((team, index) => (
                <div
                  key={team.team}
                  className="flex items-center gap-8 p-8 bg-gradient-to-r from-slate-800/60 to-slate-900/40 border border-slate-700/50 rounded-2xl hover:scale-[1.02] transition-all duration-300 shadow-xl"
                >
                  <div className="text-6xl font-black text-slate-400 w-20 text-center">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-5xl font-bold text-white">{team.team}</h3>
                    <div className="flex gap-6 mt-3">
                      <span className="text-2xl text-slate-400">
                        {team.memberCount} members
                      </span>
                      <span className="text-2xl text-slate-400">
                        Avg: <span className="text-green-400 font-bold">
                          ${team.avgRevenue.toLocaleString()}
                        </span>
                      </span>
                    </div>
                  </div>
                  <div className="text-7xl font-black text-green-400 tabular-nums">
                    ${team.totalRevenue.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Contests View */}
          {viewMode === 'contests' && (
            <div>
              {topContest ? (
                <TVContestWidget
                  title={topContest.title}
                  description={topContest.description || undefined}
                  endDate={new Date(topContest.endDate)}
                  prize={topContest.prizes?.[0]}
                  topParticipants={
                    contestParticipants.length > 0
                      ? contestParticipants.slice(0, 3).map(p => ({
                          rank: p.rank,
                          name: p.name,
                          avatar: p.avatar ?? undefined,
                          score: p.score,
                        }))
                      : [
                          { rank: 1, name: 'No participants yet', avatar: undefined, score: 0 },
                          { rank: 2, name: 'No participants yet', avatar: undefined, score: 0 },
                          { rank: 3, name: 'No participants yet', avatar: undefined, score: 0 },
                        ]
                  }
                />
              ) : (
                <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-16 text-center">
                  <p className="text-4xl text-slate-400 font-semibold">
                    No active contests at this time
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Achievements View */}
          {viewMode === 'achievements' && (
            <TVAchievementFeed achievements={mockAchievements} />
          )}
        </div>

        {/* Footer */}
        <div className="mt-12 flex items-center justify-between text-slate-500">
          <div className="flex items-center gap-4">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <p className="text-xl font-medium">Live • Updates every 30 seconds</p>
          </div>
          <p className="text-lg">
            Press <kbd className="px-2 py-1 bg-slate-700 rounded">F</kbd> for fullscreen •
            <kbd className="px-2 py-1 bg-slate-700 rounded ml-2">←</kbd>
            <kbd className="px-2 py-1 bg-slate-700 rounded ml-1">→</kbd> to navigate
          </p>
        </div>
      </div>

      {/* Rep Detail Modal */}
      <RepDetailModal
        repId={selectedRepId}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
}

// Helper function to calculate team standings
function calculateTeamStandings(salesReps: SalesRep[]): TeamStanding[] {
  const teamMap = new Map<string, { totalRevenue: number; members: SalesRep[] }>();

  salesReps.forEach(rep => {
    const existing = teamMap.get(rep.team) || { totalRevenue: 0, members: [] };
    existing.totalRevenue += Number(rep.monthlyRevenue);
    existing.members.push(rep);
    teamMap.set(rep.team, existing);
  });

  const standings: TeamStanding[] = [];
  teamMap.forEach((data, team) => {
    standings.push({
      team,
      totalRevenue: data.totalRevenue,
      memberCount: data.members.length,
      avgRevenue: data.totalRevenue / data.members.length,
      trend: 'same', // Would need historical data to determine
    });
  });

  return standings.sort((a, b) => b.totalRevenue - a.totalRevenue);
}
